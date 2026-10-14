<?php

namespace App\Services;

use App\CentralLogics\Helpers;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class CustomerOrderReadService
{
    private const PAST_STATUSES = [
        'delivered',
        'canceled',
        'cancelled',
        'refund_requested',
        'refund_request_canceled',
        'refunded',
        'failed',
        'returned',
    ];

    public function index(
        User $user,
        int $limit = 20,
        ?int $cursor = null,
        string $filter = 'all',
    ): array {
        $query = $this->owned($user)
            ->select([
                'id', 'user_id', 'store_id', 'order_amount', 'order_status',
                'payment_method', 'payment_status', 'created_at',
            ])
            ->with([
                'store:id,name',
                'customerSubmission:id,order_id,quote_id',
            ])
            ->withCount('details')
            ->when($cursor !== null, fn (Builder $builder) => $builder->where('id', '<', $cursor))
            ->when($filter === 'active', fn (Builder $builder) => $builder->whereNotIn('order_status', self::PAST_STATUSES))
            ->when($filter === 'past', fn (Builder $builder) => $builder->whereIn('order_status', self::PAST_STATUSES))
            ->orderByDesc('id')
            ->limit($limit + 1)
            ->get();

        $hasMore = $query->count() > $limit;
        if ($hasMore) {
            $query->pop();
        }

        return [
            'orders' => $query->map(fn (Order $order) => $this->summary($order))->values()->all(),
            'page' => [
                'next_cursor' => $hasMore ? (int) $query->last()->id : null,
                'has_more' => $hasMore,
            ],
            'filter' => $filter,
        ];
    }

    public function show(User $user, int $id): ?array
    {
        $order = $this->owned($user)
            ->with([
                'store:id,name',
                'customerSubmission:id,order_id,quote_id',
                'details:id,order_id,item_id,item_details,quantity',
                'details.item:id,name',
            ])
            ->withCount('details')
            ->find($id);
        if (! $order) {
            return null;
        }

        $delivery = $this->object((string) ($order->delivery_address ?? ''));

        return $this->summary($order) + [
            'delivery' => [
                'label' => $this->nullableString($delivery['address_type'] ?? null),
                'address' => $this->nullableString($delivery['address'] ?? null),
                'landmark' => $this->nullableString($delivery['landmark'] ?? null),
            ],
            'delivery_instruction' => $this->nullableString($order->delivery_instruction),
            'lines' => $order->details->map(fn (OrderDetail $detail) => [
                'id' => (int) $detail->id,
                'item_id' => (int) $detail->item_id,
                'name' => $this->lineName($detail),
                'quantity' => (int) $detail->quantity,
            ])->values()->all(),
        ];
    }

    private function owned(User $user): Builder
    {
        return Order::query()
            ->where('user_id', $user->id)
            ->where('is_guest', 0)
            ->notHiddenForCustomer()
            ->notpos();
    }

    private function summary(Order $order): array
    {
        return [
            'id' => (int) $order->id,
            'quote_token' => $order->customerSubmission?->quote_id,
            'currency' => strtoupper((string) Helpers::currency_code()),
            'total_minor' => (int) round(((float) $order->order_amount) * 100),
            'status' => (string) $order->order_status,
            'payment' => [
                'method' => (string) $order->payment_method,
                'status' => (string) $order->payment_status,
            ],
            'placed_at' => Carbon::parse($order->getRawOriginal('created_at'))->utc()->toIso8601String(),
            'store' => $order->store ? [
                'id' => (int) $order->store->id,
                'name' => (string) $order->store->name,
            ] : null,
            'item_count' => (int) $order->details_count,
        ];
    }

    private function lineName(OrderDetail $detail): string
    {
        $snapshot = $this->object((string) ($detail->item_details ?? ''));
        $name = $this->nullableString($snapshot['name'] ?? null)
            ?? $this->nullableString($detail->item?->name);

        return $name ?? 'Item unavailable';
    }

    private function object(string $value): array
    {
        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : [];
    }

    private function nullableString(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }
        $normalized = trim($value);

        return $normalized === '' ? null : $normalized;
    }
}
