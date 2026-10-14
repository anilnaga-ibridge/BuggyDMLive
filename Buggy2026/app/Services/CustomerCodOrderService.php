<?php

namespace App\Services;

use App\CentralLogics\Helpers;
use App\Exceptions\CheckoutQuoteException;
use App\Exceptions\CustomerOrderSubmissionException;
use App\Models\CustomerCheckoutQuote;
use App\Models\CustomerOrderSubmission;
use App\Models\Item;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\TaxModule\Services\CalculateTaxService;

class CustomerCodOrderService
{
    public function __construct(private CustomerCheckoutQuoteService $quotes) {}

    public function submit(
        User $actor,
        string $quoteToken,
        string $idempotencyKey,
        ?string $deliveryInstruction,
    ): array {
        $keyHash = hash('sha256', $idempotencyKey);
        $requestHash = hash('sha256', json_encode([
            'delivery_instruction' => $deliveryInstruction,
            'payment_method' => 'cash_on_delivery',
            'quote_token' => $quoteToken,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));

        try {
            return DB::transaction(function () use (
                $actor, $quoteToken, $keyHash, $requestHash, $deliveryInstruction
            ) {
                $user = User::whereKey($actor->id)->lockForUpdate()->firstOrFail();
                $existing = CustomerOrderSubmission::where([
                    'user_id' => $user->id,
                    'idempotency_key_hash' => $keyHash,
                ])->lockForUpdate()->first();
                if ($existing) {
                    return $this->replay($existing, $requestHash);
                }

                $quote = CustomerCheckoutQuote::whereKey($quoteToken)
                    ->where('user_id', $user->id)
                    ->lockForUpdate()
                    ->first();
                if (! $quote) {
                    throw new CustomerOrderSubmissionException('QUOTE_NOT_FOUND', 404);
                }
                $quoteSubmission = CustomerOrderSubmission::where('quote_id', $quote->id)
                    ->lockForUpdate()->first();
                if ($quoteSubmission) {
                    throw new CustomerOrderSubmissionException('QUOTE_ALREADY_SUBMITTED', 409);
                }

                $submission = CustomerOrderSubmission::create([
                    'id' => (string) Str::uuid(),
                    'user_id' => $user->id,
                    'quote_id' => $quote->id,
                    'idempotency_key_hash' => $keyHash,
                    'request_hash' => $requestHash,
                    'state' => 'processing',
                ]);

                try {
                    $context = $this->quotes->reconcileForPlacement($quote, $user);
                } catch (CheckoutQuoteException $error) {
                    throw new CustomerOrderSubmissionException($error->getMessage(), $error->status);
                }
                $pricing = $context['pricing'];
                $capabilities = $pricing['capabilities'];
                if (
                    $capabilities['has_campaign'] || $capabilities['has_variations']
                    || $capabilities['has_addons'] || $capabilities['has_flash_discount']
                    || $capabilities['has_store_discount_override']
                    || $capabilities['first_order_discount_minor'] > 0
                    || $capabilities['pro_discount_minor'] > 0
                ) {
                    throw new CustomerOrderSubmissionException('ORDER_CONFIGURATION_UNSUPPORTED', 409);
                }

                $tax = Helpers::getFinalCalculatedTax(
                    $pricing['tax_details'], [], $pricing['discount_major'],
                    $pricing['after_discount_major'], $context['store']->id, true
                );
                if ((int) round(((float) ($tax['tax_amount'] ?? 0)) * 100) !== (int) $quote->tax_minor) {
                    throw new CustomerOrderSubmissionException('QUOTE_RECONCILIATION_REQUIRED', 409);
                }

                $address = $context['address'];
                $order = new Order;
                $order->user_id = $user->id;
                $order->order_amount = $quote->total_minor / 100;
                $order->payment_status = 'unpaid';
                $order->order_status = 'pending';
                $order->payment_method = 'cash_on_delivery';
                $order->delivery_address_id = $address->id;
                $order->delivery_instruction = $deliveryInstruction;
                $order->order_type = 'delivery';
                $order->store_id = $quote->store_id;
                $order->delivery_charge = $quote->delivery_minor / 100;
                $order->original_delivery_charge = $quote->delivery_minor / 100;
                $order->schedule_at = now();
                $order->scheduled = 0;
                $order->otp = (string) random_int(1000, 9999);
                $order->pending = now();
                $order->delivery_address = json_encode([
                    'contact_person_name' => (string) ($address->contact_person_name ?: trim($user->f_name.' '.$user->l_name)),
                    'contact_person_number' => (string) ($address->contact_person_number ?: $user->phone),
                    'contact_person_email' => (string) $user->email,
                    'address_type' => (string) $address->address_type,
                    'address' => (string) $address->address,
                    'landmark' => (string) ($address->landmark ?? ''),
                    'floor' => (string) ($address->floor ?? ''),
                    'road' => (string) ($address->road ?? ''),
                    'house' => (string) ($address->house ?? ''),
                    'longitude' => (string) $address->longitude,
                    'latitude' => (string) $address->latitude,
                ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
                $order->zone_id = $quote->zone_id;
                $order->module_id = $quote->module_id;
                $order->distance = 0;
                $order->is_guest = 0;
                $order->total_tax_amount = $quote->tax_minor / 100;
                $order->tax_status = $tax['tax_status'] ?? 'excluded';
                $order->tax_type = $tax['taxType'] ?? null;
                $order->save();

                $taxMap = collect($tax['taxMap'] ?? []);
                foreach ($pricing['order_lines'] as $line) {
                    $matched = $taxMap->first(fn ($entry) => (int) data_get($entry, 'product_id') === (int) $line['item_id']
                    );
                    DB::table('order_details')->insert([
                        'order_id' => $order->id,
                        'item_id' => $line['item_id'],
                        'item_campaign_id' => null,
                        'price' => $line['price'],
                        'item_details' => json_encode($line['item_details'], JSON_UNESCAPED_UNICODE),
                        'variation' => json_encode($line['variation']),
                        'variant' => $line['variant'],
                        'add_ons' => json_encode($line['add_ons']),
                        'discount_on_item' => $line['discount_on_item'],
                        'discount_type' => $line['discount_type'],
                        'quantity' => $line['quantity'],
                        'tax_amount' => (float) data_get($matched, 'totalTaxamount', 0),
                        'tax_status' => (int) data_get($matched, 'include', 0) === 1 ? 'included' : 'excluded',
                        'total_add_on_price' => 0,
                        'category_id' => $line['category_id'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    $item = Item::whereKey($line['item_id'])->lockForUpdate()->firstOrFail();
                    $tracksStock = (bool) (
                        config('module.'.$context['store']->module?->module_type)['stock'] ?? false
                    );
                    if ($tracksStock && $item->stock !== null) {
                        $changed = Item::whereKey($item->id)
                            ->where('stock', '>=', $line['quantity'])
                            ->decrement('stock', $line['quantity']);
                        if ($changed !== 1) {
                            throw new CustomerOrderSubmissionException('CART_ITEM_OUT_OF_STOCK', 409);
                        }
                    }
                }
                $taxIds = data_get($tax, 'taxData.orderTaxIds', []);
                if ($taxIds) {
                    CalculateTaxService::updateOrderTaxData($order->id, $taxIds);
                }

                $context['store']->increment('total_order');
                foreach ($context['carts'] as $cart) {
                    $cart->delete();
                }
                $user->zone_id = $quote->zone_id;
                $user->save();
                $quote->consumed_at = now();
                $quote->save();

                $body = ['order' => $this->resource($order, $quote)];
                $submission->update([
                    'order_id' => $order->id,
                    'state' => 'completed',
                    'response_status' => 201,
                    'response_body' => $body,
                    'completed_at' => now(),
                ]);

                return ['status' => 201, 'body' => $body, 'replayed' => false];
            }, 3);
        } catch (QueryException $error) {
            if (! in_array((int) ($error->errorInfo[1] ?? 0), [1062, 19], true)) {
                throw $error;
            }
            $existing = CustomerOrderSubmission::where([
                'user_id' => $actor->id,
                'idempotency_key_hash' => $keyHash,
            ])->first();
            if (! $existing) {
                throw $error;
            }

            return $this->replay($existing, $requestHash);
        }
    }

    public function recover(User $user, string $idempotencyKey): ?array
    {
        $submission = CustomerOrderSubmission::where([
            'user_id' => $user->id,
            'idempotency_key_hash' => hash('sha256', $idempotencyKey),
        ])->first();
        if (! $submission) {
            return null;
        }
        if ($submission->state !== 'completed' || ! $submission->response_body) {
            return ['status' => 'processing'];
        }

        return ['status' => 'completed', ...$submission->response_body];
    }

    private function replay(CustomerOrderSubmission $submission, string $requestHash): array
    {
        if (! hash_equals($submission->request_hash, $requestHash)) {
            throw new CustomerOrderSubmissionException('IDEMPOTENCY_KEY_REUSED', 409);
        }
        if ($submission->state !== 'completed' || ! $submission->response_body) {
            throw new CustomerOrderSubmissionException('ORDER_SUBMISSION_IN_PROGRESS', 409);
        }

        return ['status' => 200, 'body' => $submission->response_body, 'replayed' => true];
    }

    private function resource(Order $order, CustomerCheckoutQuote $quote): array
    {
        return [
            'id' => (int) $order->id,
            'quote_token' => (string) $quote->id,
            'currency' => (string) $quote->currency,
            'total_minor' => (int) $quote->total_minor,
            'status' => (string) $order->order_status,
            'payment' => [
                'method' => 'cash_on_delivery',
                'status' => (string) $order->payment_status,
            ],
            'placed_at' => Carbon::parse($order->getRawOriginal('created_at'))->utc()->toIso8601String(),
        ];
    }
}
