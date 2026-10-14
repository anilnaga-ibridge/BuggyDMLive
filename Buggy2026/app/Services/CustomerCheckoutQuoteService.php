<?php

namespace App\Services;

use App\CentralLogics\DeliveryFeeLogic;
use App\CentralLogics\Helpers;
use App\Exceptions\CheckoutQuoteException;
use App\Models\AddOn;
use App\Models\BusinessSetting;
use App\Models\Cart;
use App\Models\CustomerAddress;
use App\Models\CustomerCheckoutQuote;
use App\Models\Item;
use App\Models\ItemCampaign;
use App\Models\Store;
use App\Models\User;
use App\Models\Zone;
use App\Traits\ManagesProCustomerSubscription;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use MatanYadaev\EloquentSpatial\Objects\Point;

class CustomerCheckoutQuoteService
{
    use ManagesProCustomerSubscription;

    private const QUOTE_MINUTES = 5;

    public function __construct(private CheckoutQuoteFingerprint $fingerprint) {}

    public function create(
        User $user,
        int $addressId,
        int $storeId,
        int $moduleId,
        string $idempotencyKey,
    ): CustomerCheckoutQuote {
        $requestHash = $this->fingerprint->hash([
            'address_id' => $addressId,
            'store_id' => $storeId,
            'module_id' => $moduleId,
        ]);
        $keyHash = hash('sha256', $idempotencyKey);

        return DB::transaction(function () use (
            $user,
            $addressId,
            $storeId,
            $moduleId,
            $requestHash,
            $keyHash,
        ) {
            $existing = CustomerCheckoutQuote::where([
                'user_id' => $user->id,
                'idempotency_key_hash' => $keyHash,
            ])->lockForUpdate()->first();
            if ($existing) {
                if (! hash_equals($existing->request_hash, $requestHash)) {
                    throw new CheckoutQuoteException('IDEMPOTENCY_KEY_REUSED', 409);
                }

                return $existing;
            }

            $address = CustomerAddress::where([
                'id' => $addressId,
                'user_id' => $user->id,
            ])->lockForUpdate()->first();
            if (! $address) {
                throw new CheckoutQuoteException('ADDRESS_NOT_FOUND', 404, 'address_id');
            }

            $zone = Zone::whereKey($address->zone_id)
                ->where('status', 1)
                ->whereContains(
                    'coordinates',
                    new Point((float) $address->latitude, (float) $address->longitude, POINT_SRID)
                )
                ->whereHas('modules', fn ($query) => $query->where('modules.id', $moduleId))
                ->first();
            if (! $zone) {
                throw new CheckoutQuoteException('DELIVERY_AREA_UNAVAILABLE', 422, 'address_id');
            }

            $store = Store::with(['module', 'discount', 'store_sub'])
                ->whereKey($storeId)
                ->first();
            if (
                ! $store ||
                (int) $store->status !== 1 ||
                (isset($store->active) && (int) $store->active !== 1) ||
                ! (bool) $store->delivery ||
                (int) $store->module_id !== $moduleId ||
                (int) $store->zone_id !== (int) $zone->id ||
                ! $this->isStoreOpen($store)
            ) {
                throw new CheckoutQuoteException('STORE_UNAVAILABLE', 422, 'store_id');
            }

            $carts = Cart::where([
                'user_id' => $user->id,
                'is_guest' => 0,
                'store_id' => $storeId,
                'module_id' => $moduleId,
            ])->orderBy('id')->lockForUpdate()->get();
            if ($carts->isEmpty()) {
                throw new CheckoutQuoteException('EMPTY_CART', 422);
            }

            $pricing = $this->priceCart($carts, $store, $user);
            if ((float) $store->minimum_order > $pricing['subtotal_major']) {
                throw new CheckoutQuoteException('MINIMUM_ORDER_NOT_MET', 422);
            }

            $deliveryMajor = $this->deliveryFee($store, $zone, $moduleId, $address);
            $effective = DeliveryFeeLogic::effectiveFee(
                $deliveryMajor,
                $store,
                $pricing['after_discount_major']
            );
            $deliveryMajor = (float) $effective['fee'];
            $proDelivery = $this->applyProCustomerDeliveryFee(
                $pricing['pro_offer'],
                $deliveryMajor,
                $pricing['after_discount_major'],
                $effective['free_by'],
                $store->module?->module_type
            );
            $deliveryMajor = (float) $proDelivery['delivery_charge'];

            $payments = $this->paymentMethods(
                $zone,
                $pricing['after_discount_major'] + $pricing['tax_major'] + $deliveryMajor,
                $moduleId
            );
            if ($payments === []) {
                throw new CheckoutQuoteException('PAYMENT_UNAVAILABLE', 422);
            }

            $subtotalMinor = $this->minor($pricing['subtotal_major']);
            $discountMinor = $this->minor($pricing['discount_major']);
            $taxMinor = $this->minor($pricing['tax_major']);
            $deliveryMinor = $this->minor($deliveryMajor);
            $totalMinor = max(0, $subtotalMinor - $discountMinor + $taxMinor + $deliveryMinor);
            $expiresAt = now()->addMinutes(self::QUOTE_MINUTES);
            $cartFingerprint = $this->fingerprint->hash($pricing['fingerprint_lines']);

            $snapshot = [
                'version' => 2,
                'address' => [
                    'id' => (int) $address->id,
                    'zone_id' => (int) $zone->id,
                    'address' => (string) $address->address,
                    'latitude' => (float) $address->latitude,
                    'longitude' => (float) $address->longitude,
                    'version' => $address->updated_at?->utc()->toIso8601String(),
                ],
                'store' => [
                    'id' => (int) $store->id,
                    'name' => (string) $store->name,
                ],
                'line_items' => $pricing['line_items'],
                'order_lines' => $pricing['order_lines'],
                'pricing_capabilities' => $pricing['capabilities'],
                'payment_methods' => $payments,
                'totals' => [
                    'subtotal_minor' => $subtotalMinor,
                    'discount_minor' => $discountMinor,
                    'tax_minor' => $taxMinor,
                    'delivery_minor' => $deliveryMinor,
                    'total_minor' => $totalMinor,
                ],
            ];

            return CustomerCheckoutQuote::create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'address_id' => $address->id,
                'store_id' => $storeId,
                'module_id' => $moduleId,
                'zone_id' => $zone->id,
                'idempotency_key_hash' => $keyHash,
                'request_hash' => $requestHash,
                'cart_fingerprint' => $cartFingerprint,
                'currency' => strtoupper((string) Helpers::currency_code()),
                'subtotal_minor' => $subtotalMinor,
                'discount_minor' => $discountMinor,
                'tax_minor' => $taxMinor,
                'delivery_minor' => $deliveryMinor,
                'total_minor' => $totalMinor,
                'snapshot' => $snapshot,
                'expires_at' => $expiresAt,
            ]);
        });
    }

    public function resource(CustomerCheckoutQuote $quote): array
    {
        return [
            'quote_token' => $quote->id,
            'currency' => $quote->currency,
            'subtotal_minor' => (int) $quote->subtotal_minor,
            'discount_minor' => (int) $quote->discount_minor,
            'tax_minor' => (int) $quote->tax_minor,
            'delivery_minor' => (int) $quote->delivery_minor,
            'total_minor' => (int) $quote->total_minor,
            'expires_at' => $quote->expires_at->utc()->toIso8601String(),
            'cart_fingerprint' => $quote->cart_fingerprint,
            'line_items' => $quote->snapshot['line_items'] ?? [],
            'payment_methods' => $quote->snapshot['payment_methods'] ?? [],
        ];
    }

    /**
     * Rebuild the quote while all mutable checkout rows are locked. The caller
     * must already be inside a database transaction and hold a lock on $quote.
     */
    public function reconcileForPlacement(CustomerCheckoutQuote $quote, User $user): array
    {
        if ((int) $quote->user_id !== (int) $user->id) {
            throw new CheckoutQuoteException('QUOTE_NOT_FOUND', 404);
        }
        if ($quote->consumed_at) {
            throw new CheckoutQuoteException('QUOTE_ALREADY_CONSUMED', 409);
        }
        if (! $quote->expires_at || $quote->expires_at->isPast()) {
            throw new CheckoutQuoteException('QUOTE_EXPIRED', 409);
        }

        $address = CustomerAddress::where([
            'id' => $quote->address_id,
            'user_id' => $user->id,
        ])->lockForUpdate()->first();
        if (! $address) {
            throw new CheckoutQuoteException('ADDRESS_NOT_FOUND', 404, 'address_id');
        }
        $quotedAddressVersion = data_get($quote->snapshot, 'address.version');
        if (! $quotedAddressVersion || $quotedAddressVersion !== $address->updated_at?->utc()->toIso8601String()) {
            throw new CheckoutQuoteException('ADDRESS_CHANGED', 409, 'address_id');
        }

        $store = Store::with(['module', 'discount', 'store_sub'])
            ->whereKey($quote->store_id)
            ->lockForUpdate()
            ->first();
        $zone = Zone::whereKey($quote->zone_id)->where('status', 1)->lockForUpdate()->first();
        if (
            ! $store || ! $zone || (int) $store->module_id !== (int) $quote->module_id
            || (int) $store->status !== 1 || ! (bool) $store->delivery
            || (isset($store->active) && (int) $store->active !== 1)
            || ! $this->isStoreOpen($store)
        ) {
            throw new CheckoutQuoteException('STORE_UNAVAILABLE', 409);
        }

        $carts = Cart::where([
            'user_id' => $user->id,
            'is_guest' => 0,
            'store_id' => $quote->store_id,
            'module_id' => $quote->module_id,
        ])->orderBy('id')->lockForUpdate()->get();
        if ($carts->isEmpty()) {
            throw new CheckoutQuoteException('CART_CHANGED', 409);
        }

        $pricing = $this->priceCart($carts, $store, $user, true);
        $deliveryMajor = $this->deliveryFee($store, $zone, (int) $quote->module_id, $address);
        $effective = DeliveryFeeLogic::effectiveFee($deliveryMajor, $store, $pricing['after_discount_major']);
        $deliveryMajor = (float) $effective['fee'];
        $proDelivery = $this->applyProCustomerDeliveryFee(
            $pricing['pro_offer'],
            $deliveryMajor,
            $pricing['after_discount_major'],
            $effective['free_by'],
            $store->module?->module_type
        );
        $deliveryMajor = (float) $proDelivery['delivery_charge'];

        $current = [
            'subtotal_minor' => $this->minor($pricing['subtotal_major']),
            'discount_minor' => $this->minor($pricing['discount_major']),
            'tax_minor' => $this->minor($pricing['tax_major']),
            'delivery_minor' => $this->minor($deliveryMajor),
        ];
        $current['total_minor'] = max(
            0,
            $current['subtotal_minor'] - $current['discount_minor']
                + $current['tax_minor'] + $current['delivery_minor']
        );
        $fingerprint = $this->fingerprint->hash($pricing['fingerprint_lines']);
        foreach ($current as $field => $value) {
            if ((int) $quote->{$field} !== $value) {
                throw new CheckoutQuoteException('QUOTE_RECONCILIATION_REQUIRED', 409);
            }
        }
        if (! hash_equals((string) $quote->cart_fingerprint, $fingerprint)) {
            throw new CheckoutQuoteException('CART_CHANGED', 409);
        }
        $methods = $this->paymentMethods(
            $zone,
            $pricing['after_discount_major'] + $pricing['tax_major'] + $deliveryMajor,
            (int) $quote->module_id
        );
        if (! in_array('cash_on_delivery', $methods, true)) {
            throw new CheckoutQuoteException('PAYMENT_UNAVAILABLE', 409);
        }

        return compact('address', 'store', 'zone', 'carts', 'pricing') + [
            'delivery_major' => $deliveryMajor,
        ];
    }

    private function priceCart($carts, Store $store, User $user, bool $lockCatalog = false): array
    {
        $lineItems = [];
        $fingerprintLines = [];
        $taxDetails = [];
        $orderLines = [];
        $subtotal = 0.0;
        $productGross = 0.0;
        $lineDiscount = 0.0;
        $hasFlashDiscount = false;
        $hasStoreDiscountOverride = false;

        foreach ($carts as $cart) {
            $isCampaign = in_array($cart->item_type, [
                ItemCampaign::class,
                'AppModelsItemCampaign',
            ], true);
            $itemQuery = $isCampaign
                ? ItemCampaign::with('module')->active()
                : Item::with('module')->active();
            if ($lockCatalog) {
                $itemQuery->lockForUpdate();
            }
            $item = $itemQuery->find($cart->item_id);
            if (! $item || (int) $item->store_id !== (int) $store->id || (int) $item->module_id !== (int) $cart->module_id) {
                throw new CheckoutQuoteException('CART_ITEM_UNAVAILABLE', 409);
            }

            $quantity = (int) $cart->quantity;
            if ($quantity < 1 || ($item->maximum_cart_quantity && $quantity > $item->maximum_cart_quantity)) {
                throw new CheckoutQuoteException('CART_QUANTITY_INVALID', 409);
            }

            $variation = is_array($cart->variation) ? $cart->variation : [];
            $unitPrice = (float) $item->price;
            $stock = $item->stock;
            if ($item->module?->module_type === 'food') {
                $foodVariations = json_decode($item->food_variations ?? '[]', true) ?: [];
                if ($foodVariations !== [] && $variation !== []) {
                    $variant = Helpers::get_varient($foodVariations, $variation);
                    $unitPrice += (float) ($variant['price'] ?? 0);
                }
            } else {
                $variations = json_decode($item->variations ?? '[]', true) ?: [];
                if ($variations !== [] && $variation !== []) {
                    $variant = Helpers::variation_price($item, json_encode($variation));
                    $unitPrice = (float) ($variant['price'] ?? $unitPrice);
                    $stock = $variant['stock'] ?? $stock;
                }
                $tracksStock = (bool) (config('module.'.$item->module?->module_type)['stock'] ?? false);
                if ($tracksStock && $stock !== null && $quantity > (int) $stock) {
                    throw new CheckoutQuoteException('CART_ITEM_OUT_OF_STOCK', 409);
                }
            }

            $addonIds = is_array($cart->add_on_ids) ? $cart->add_on_ids : [];
            $addonQtys = is_array($cart->add_on_qtys) ? $cart->add_on_qtys : [];
            $addons = AddOn::active()->where('store_id', $store->id)->whereIn('id', $addonIds)->get();
            if (count($addonIds) !== $addons->count()) {
                throw new CheckoutQuoteException('CART_ADDON_UNAVAILABLE', 409);
            }
            $addonData = Helpers::calculate_addon_price($addons, $addonQtys);
            $addonTotal = (float) $addonData['total_add_on_price'];
            $discount = Helpers::product_discount_calculate($item, $unitPrice, $store, false);
            $discountTotal = min($unitPrice, max(0, (float) $discount['discount_amount'])) * $quantity;
            $productLineGross = $unitPrice * $quantity;
            $lineSubtotal = ($unitPrice * $quantity) + $addonTotal;
            $lineTotal = max(0, $lineSubtotal - $discountTotal);

            $subtotal += $lineSubtotal;
            $productGross += $productLineGross;
            $lineDiscount += $discountTotal;
            $hasFlashDiscount = $hasFlashDiscount || $discount['discount_type'] === 'flash_sale';
            $name = (string) ($isCampaign ? $item->title : $item->name);
            $lineItems[] = [
                'cart_id' => (int) $cart->id,
                'item_id' => (int) $item->id,
                'name' => $name,
                'quantity' => $quantity,
                'unit_price_minor' => $this->minor($unitPrice),
                'addon_minor' => $this->minor($addonTotal),
                'discount_minor' => $this->minor($discountTotal),
                'line_total_minor' => $this->minor($lineTotal),
                '_product_gross_major' => $productLineGross,
            ];
            $fingerprintLines[] = [
                'cart_id' => (int) $cart->id,
                'item_id' => (int) $item->id,
                'item_type' => $isCampaign ? 'campaign' : 'item',
                'quantity' => $quantity,
                'variation' => $variation,
                'addon_ids' => $addonIds,
                'addon_qtys' => $addonQtys,
                'item_updated_at' => $item->updated_at?->toISOString(),
                'unit_price_minor' => $this->minor($unitPrice),
            ];
            $taxDetails[] = [
                'item_id' => $isCampaign ? null : (int) $item->id,
                'item_campaign_id' => $isCampaign ? (int) $item->id : null,
                'price' => $unitPrice,
                'quantity' => $quantity,
                'category_id' => $item->category_id,
                'discount_on_item' => $discountTotal,
                'discount_type' => 'quote_line_discount',
                'add_ons' => json_encode($addonData['addons']),
                'addon_discount' => 0,
                'total_add_on_price' => $addonTotal,
            ];
            $orderLines[] = [
                'cart_id' => (int) $cart->id,
                'item_id' => $isCampaign ? null : (int) $item->id,
                'item_campaign_id' => $isCampaign ? (int) $item->id : null,
                'category_id' => (int) $item->category_id,
                'price' => $unitPrice,
                'quantity' => $quantity,
                'variation' => $variation,
                'variant' => (string) ($cart->variant ?? ''),
                'add_ons' => $addonData['addons'],
                'add_on_ids' => $addonIds,
                'discount_on_item' => $discountTotal,
                'discount_type' => 'quote_line_discount',
                'total_add_on_price' => $addonTotal,
                'item_details' => $item->toArray(),
            ];
        }

        $storeDiscount = Helpers::get_store_discount($store);
        if ($storeDiscount && ! $hasFlashDiscount && $productGross > 0) {
            $storeDiscountTotal = (float) Helpers::checkAdminDiscount(
                price: $productGross,
                discount: $storeDiscount['discount'],
                max_discount: $storeDiscount['max_discount'],
                min_purchase: $storeDiscount['min_purchase']
            );
            if ($storeDiscountTotal > $lineDiscount) {
                $hasStoreDiscountOverride = true;
                $lineDiscount = $storeDiscountTotal;
                $remaining = $storeDiscountTotal;
                $lastIndex = count($lineItems) - 1;
                foreach ($lineItems as $index => &$line) {
                    $allocated = $index === $lastIndex
                        ? $remaining
                        : round(
                            $storeDiscountTotal
                                * ((float) $line['_product_gross_major'] / $productGross),
                            6
                        );
                    $allocated = min((float) $line['_product_gross_major'], max(0, $allocated));
                    $remaining = max(0, $remaining - $allocated);
                    $line['discount_minor'] = $this->minor($allocated);
                    $line['line_total_minor'] = max(
                        0,
                        $line['unit_price_minor'] * $line['quantity']
                            + $line['addon_minor']
                            - $line['discount_minor']
                    );
                    $taxDetails[$index]['discount_on_item'] = $allocated;
                    $orderLines[$index]['discount_on_item'] = $allocated;
                }
                unset($line);
            }
        }
        foreach ($lineItems as &$line) {
            unset($line['_product_gross_major']);
        }
        unset($line);

        $afterLineDiscount = max(0, $subtotal - $lineDiscount);
        $firstOrderDiscount = 0.0;
        $customer = User::withCount('orders')->find($user->id);
        if ($customer) {
            $firstOrder = Helpers::getCusromerFirstOrderDiscount(
                order_count: $customer->orders_count,
                user_creation_date: $customer->created_at,
                refby: $customer->ref_by,
                price: $afterLineDiscount
            );
            if (data_get($firstOrder, 'is_valid')) {
                $firstOrderDiscount = min(
                    $afterLineDiscount,
                    max(0, (float) data_get($firstOrder, 'calculated_amount', 0))
                );
            }
        }
        $afterFirstOrder = max(0, $afterLineDiscount - $firstOrderDiscount);
        $pro = $this->applyProCustomerDiscount(
            $user->id,
            $subtotal,
            $afterFirstOrder,
            $store->module?->module_type
        );
        $proDiscount = (float) $pro['discount'];
        $afterDiscount = (float) $pro['total_price'];
        $discountTotal = $lineDiscount + $firstOrderDiscount + $proDiscount;

        $tax = Helpers::getFinalCalculatedTax(
            $taxDetails,
            [],
            $discountTotal,
            $afterDiscount,
            $store->id,
            false
        );

        return [
            'subtotal_major' => $subtotal,
            'discount_major' => $discountTotal,
            'after_discount_major' => $afterDiscount,
            'tax_major' => max(0, (float) ($tax['tax_amount'] ?? 0)),
            'tax_map' => $tax['taxMap'] ?? [],
            'tax_included' => (bool) ($tax['tax_included'] ?? $tax['include'] ?? false),
            'line_items' => $lineItems,
            'order_lines' => $orderLines,
            'tax_details' => $taxDetails,
            'fingerprint_lines' => $fingerprintLines,
            'pro_offer' => $pro['offer'],
            'capabilities' => [
                'has_campaign' => collect($orderLines)->contains(fn ($line) => $line['item_campaign_id'] !== null),
                'has_variations' => collect($orderLines)->contains(fn ($line) => $line['variation'] !== []),
                'has_addons' => collect($orderLines)->contains(fn ($line) => $line['add_on_ids'] !== []),
                'has_flash_discount' => $hasFlashDiscount,
                'has_store_discount_override' => $hasStoreDiscountOverride,
                'first_order_discount_minor' => $this->minor($firstOrderDiscount),
                'pro_discount_minor' => $this->minor($proDiscount),
            ],
        ];
    }

    private function deliveryFee(Store $store, Zone $zone, int $moduleId, CustomerAddress $address): float
    {
        if ((int) $store->self_delivery_system === 1) {
            $perKm = (float) $store->per_km_shipping_charge;
            $minimum = (float) $store->minimum_shipping_charge;
            $maximum = (float) $store->maximum_shipping_charge;
        } else {
            $module = $zone->modules()->where('modules.id', $moduleId)->first();
            if (! $module) {
                throw new CheckoutQuoteException('DELIVERY_AREA_UNAVAILABLE', 422);
            }
            $pivot = $module->pivot;
            if ($pivot->delivery_charge_type === 'fixed') {
                return max(0, (float) $pivot->fixed_shipping_charge);
            }
            $perKm = (float) $pivot->per_km_shipping_charge;
            $minimum = (float) $pivot->minimum_shipping_charge;
            $maximum = (float) $pivot->maximum_shipping_charge;
        }

        $distance = $this->distanceKm(
            (float) $store->latitude,
            (float) $store->longitude,
            (float) $address->latitude,
            (float) $address->longitude
        );
        $fee = max($minimum, $distance * $perKm);
        if ($maximum >= $minimum && $maximum > 0) {
            $fee = min($fee, $maximum);
        }

        return max(0, $fee);
    }

    private function paymentMethods(Zone $zone, float $amountMajor, int $moduleId): array
    {
        $settings = BusinessSetting::whereIn('key', [
            'cash_on_delivery',
            'digital_payment',
            'offline_payment_status',
        ])->pluck('value', 'key');
        $cod = (int) data_get(json_decode($settings['cash_on_delivery'] ?? '{}', true), 'status', 0) === 1;
        $digital = (int) data_get(json_decode($settings['digital_payment'] ?? '{}', true), 'status', 0) === 1;
        $offline = (int) ($settings['offline_payment_status'] ?? 0) === 1;
        $module = $zone->modules()->where('modules.id', $moduleId)->first();
        $maximumCod = (float) ($module?->pivot?->maximum_cod_order_amount ?? 0);

        $methods = [];
        if ($cod && $zone->cash_on_delivery && ($maximumCod <= 0 || $amountMajor <= $maximumCod)) {
            $methods[] = 'cash_on_delivery';
        }
        if ($digital && $zone->digital_payment && Helpers::getActivePaymentGateways() !== []) {
            $methods[] = 'digital_payment';
        }
        if ($offline && $zone->offline_payment) {
            $methods[] = 'offline_payment';
        }

        return $methods;
    }

    private function isStoreOpen(Store $store): bool
    {
        $time = now();

        return $store->schedules()
            ->where('day', $time->dayOfWeek)
            ->where('opening_time', '<=', $time->format('H:i:s'))
            ->where('closing_time', '>=', $time->format('H:i:s'))
            ->exists();
    }

    private function distanceKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadiusKm = 6371.0;
        $latDelta = deg2rad($lat2 - $lat1);
        $lngDelta = deg2rad($lng2 - $lng1);
        $a = sin($latDelta / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($lngDelta / 2) ** 2;

        return $earthRadiusKm * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    private function minor(float $major): int
    {
        return max(0, (int) round($major * 100));
    }
}
