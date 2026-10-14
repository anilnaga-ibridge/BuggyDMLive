<?php

namespace App\Services;

use App\Models\DeliveryHistory;
use App\Models\Order;
use App\Models\User;
use DateTimeInterface;
use Illuminate\Support\Carbon;

class CustomerOrderTrackingService
{
    private const TERMINAL_STATUSES = [
        'delivered',
        'canceled',
        'cancelled',
        'refund_requested',
        'refund_request_canceled',
        'refunded',
        'failed',
        'returned',
    ];

    private const LOCATION_VISIBLE_STATUSES = ['picked_up'];

    public function show(User $user, int $id): ?array
    {
        $order = Order::query()
            ->where('user_id', $user->id)
            ->where('is_guest', 0)
            ->notHiddenForCustomer()
            ->notpos()
            ->select([
                'id', 'user_id', 'delivery_man_id', 'order_status', 'created_at',
                'accepted', 'confirmed', 'processing', 'handover', 'picked_up',
                'delivered', 'canceled', 'failed', 'refund_requested', 'refunded',
                'refund_request_canceled',
            ])
            ->find($id);

        if (! $order) {
            return null;
        }

        $status = (string) $order->order_status;

        return [
            'order_id' => (int) $order->id,
            'status' => $status,
            'is_terminal' => in_array($status, self::TERMINAL_STATUSES, true),
            'refreshed_at' => now()->utc()->toIso8601String(),
            'milestones' => [
                $this->milestone('placed', $order->created_at),
                $this->milestone('confirmed', $order->confirmed ?? $order->accepted),
                $this->milestone('preparing', $order->processing),
                $this->milestone('ready', $order->handover),
                $this->milestone('out_for_delivery', $order->picked_up),
                $this->milestone('delivered', $order->delivered),
            ],
            'courier_location' => $this->courierLocation($order, $status),
        ];
    }

    private function milestone(string $key, mixed $occurredAt): array
    {
        return [
            'key' => $key,
            'occurred_at' => $this->timestamp($occurredAt)?->toIso8601String(),
        ];
    }

    private function courierLocation(Order $order, string $status): ?array
    {
        if (! $order->delivery_man_id || ! in_array($status, self::LOCATION_VISIBLE_STATUSES, true)) {
            return null;
        }

        $location = DeliveryHistory::query()
            ->where('order_id', $order->id)
            ->where('delivery_man_id', $order->delivery_man_id)
            ->select(['id', 'latitude', 'longitude', 'time', 'created_at'])
            ->orderByDesc('time')
            ->orderByDesc('id')
            ->first();

        $capturedAt = $this->timestamp($location?->time ?? $location?->created_at);
        if (! $location || ! $capturedAt || $capturedAt->lt(now()->subMinutes(10)) || $capturedAt->gt(now()->addMinutes(2))) {
            return null;
        }

        $latitude = filter_var($location->latitude, FILTER_VALIDATE_FLOAT);
        $longitude = filter_var($location->longitude, FILTER_VALIDATE_FLOAT);
        if ($latitude === false || $longitude === false
            || $latitude < -90 || $latitude > 90
            || $longitude < -180 || $longitude > 180) {
            return null;
        }

        return [
            'latitude' => round((float) $latitude, 6),
            'longitude' => round((float) $longitude, 6),
            'captured_at' => $capturedAt->toIso8601String(),
        ];
    }

    private function timestamp(mixed $value): ?Carbon
    {
        if ($value instanceof DateTimeInterface) {
            return Carbon::instance($value)->utc();
        }
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        return Carbon::parse($value)->utc();
    }
}
