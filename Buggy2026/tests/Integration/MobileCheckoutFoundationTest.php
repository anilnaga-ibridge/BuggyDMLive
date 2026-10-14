<?php

namespace Tests\Integration;

use App\Exceptions\CheckoutQuoteException;
use App\Exceptions\CustomerOrderSubmissionException;
use App\Http\Controllers\Api\V2\CustomerAddressController;
use App\Http\Controllers\Api\V2\CustomerLocationController;
use App\Models\BusinessSetting;
use App\Models\CustomerAddress;
use App\Models\Order;
use App\Models\User;
use App\Services\CustomerCheckoutQuoteService;
use App\Services\CustomerCodOrderService;
use App\Services\CustomerOrderReadService;
use App\Services\CustomerOrderTrackingService;
use App\Services\CustomerPushDeviceService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\Support\MobileCheckoutFixture;

class MobileCheckoutFoundationTest extends IntegrationTestCase
{
    public function test_push_device_registry_is_owner_scoped_encrypted_and_rotation_safe(): void
    {
        $fixture = MobileCheckoutFixture::create();
        $devices = app(CustomerPushDeviceService::class);
        $firstInstallation = '11111111111111111111111111111111';
        $secondInstallation = '22222222222222222222222222222222';

        $devices->register(
            $fixture->customer,
            $firstInstallation,
            'fcm-token-integration-first',
            'android',
            'en',
        );
        $devices->register(
            $fixture->customer,
            $secondInstallation,
            'fcm-token-integration-second',
            'ios',
            'te-IN',
        );

        $rows = DB::table('customer_push_devices')
            ->where('user_id', $fixture->customer->id)
            ->orderBy('id')
            ->get();
        $this->assertCount(2, $rows);
        $this->assertStringNotContainsString('fcm-token', $rows[0]->token_ciphertext);
        $this->assertEqualsCanonicalizing(
            ['fcm-token-integration-first', 'fcm-token-integration-second'],
            $devices->activeTokensFor($fixture->customer, false),
        );

        $devices->unregister($fixture->otherCustomer, $firstInstallation);
        $this->assertSame(2, DB::table('customer_push_devices')->count());

        $devices->register(
            $fixture->customer,
            $secondInstallation,
            'fcm-token-integration-rotated',
            'ios',
            'hi-IN',
        );
        $this->assertSame(2, DB::table('customer_push_devices')->count());
        $this->assertSame(
            'fcm-token-integration-rotated',
            User::query()->findOrFail($fixture->customer->id)->cm_firebase_token,
        );

        $devices->unregister($fixture->customer, $secondInstallation);
        $this->assertSame(1, DB::table('customer_push_devices')->count());
        $this->assertSame(
            'fcm-token-integration-first',
            User::query()->findOrFail($fixture->customer->id)->cm_firebase_token,
        );
    }

    public function test_cod_order_commit_is_atomic_and_replay_returns_the_same_order(): void
    {
        $fixture = MobileCheckoutFixture::create();
        $quote = $this->quote($fixture, 'quote-order-commit-0001');
        $orders = app(CustomerCodOrderService::class);

        $first = $orders->submit(
            $fixture->customer,
            $quote->id,
            'order-commit-idempotency-0001',
            'Call at the gate',
        );
        $replay = $orders->submit(
            $fixture->customer,
            $quote->id,
            'order-commit-idempotency-0001',
            'Call at the gate',
        );

        $this->assertSame(201, $first['status']);
        $this->assertSame(200, $replay['status']);
        $this->assertTrue($replay['replayed']);
        $this->assertEquals($first['body'], $replay['body']);
        $orderId = $first['body']['order']['id'];
        $this->assertSame(1, DB::table('orders')->where('id', $orderId)->count());
        $this->assertSame(1, DB::table('order_details')->where('order_id', $orderId)->count());
        $this->assertSame(0, DB::table('carts')->where('id', $fixture->cartId)->count());
        $this->assertSame(8, (int) DB::table('items')->where('id', $fixture->itemId)->value('stock'));
        $this->assertNotNull(DB::table('customer_checkout_quotes')->where('id', $quote->id)->value('consumed_at'));
        $this->assertSame('completed', $orders->recover(
            $fixture->customer,
            'order-commit-idempotency-0001',
        )['status']);
    }

    public function test_order_history_is_cursor_bounded_and_enforces_customer_ownership(): void
    {
        $fixture = MobileCheckoutFixture::create();
        $quote = $this->quote($fixture, 'quote-order-history-0001');
        $placed = app(CustomerCodOrderService::class)->submit(
            $fixture->customer,
            $quote->id,
            'order-history-idempotency-0001',
            'Leave at reception',
        );
        $orderId = $placed['body']['order']['id'];
        $history = app(CustomerOrderReadService::class);

        $legacyOrder = Order::findOrFail($orderId)->replicate();
        $legacyOrder->created_at = now()->subDay();
        $legacyOrder->save();

        $firstPage = $history->index($fixture->customer, 1, null, 'active');
        $this->assertCount(1, $firstPage['orders']);
        $this->assertTrue($firstPage['page']['has_more']);
        $this->assertSame($legacyOrder->id, $firstPage['page']['next_cursor']);
        $this->assertNull($firstPage['orders'][0]['quote_token']);

        $page = $history->index(
            $fixture->customer,
            20,
            $firstPage['page']['next_cursor'],
            'active',
        );
        $this->assertCount(1, $page['orders']);
        $this->assertFalse($page['page']['has_more']);
        $this->assertNull($page['page']['next_cursor']);
        $this->assertSame($orderId, $page['orders'][0]['id']);
        $this->assertSame($quote->id, $page['orders'][0]['quote_token']);
        $this->assertStringStartsWith('Integration Store ', $page['orders'][0]['store']['name']);
        $this->assertSame(1, $page['orders'][0]['item_count']);

        $detail = $history->show($fixture->customer, $orderId);
        $this->assertNotNull($detail);
        $this->assertSame('Leave at reception', $detail['delivery_instruction']);
        $this->assertSame('Synthetic Rice Pack', $detail['lines'][0]['name']);
        $this->assertSame(2, $detail['lines'][0]['quantity']);
        $this->assertSame('Synthetic Hyderabad address', $detail['delivery']['address']);
        $this->assertArrayNotHasKey('latitude', $detail['delivery']);
        $this->assertArrayNotHasKey('contact_person_number', $detail['delivery']);

        $this->assertSame([], $history->index($fixture->otherCustomer)['orders']);
        $this->assertNull($history->show($fixture->otherCustomer, $orderId));
    }

    public function test_order_tracking_is_owner_scoped_and_hides_stale_courier_locations(): void
    {
        $fixture = MobileCheckoutFixture::create();
        $quote = $this->quote($fixture, 'quote-order-tracking-0001');
        $placed = app(CustomerCodOrderService::class)->submit(
            $fixture->customer,
            $quote->id,
            'order-tracking-idempotency-0001',
            null,
        );
        $orderId = $placed['body']['order']['id'];
        $deliveryManId = DB::table('delivery_men')->insertGetId([
            'f_name' => 'Synthetic',
            'l_name' => 'Courier',
            'phone' => '+917000000001',
            'email' => 'synthetic-courier@example.test',
            'password' => bcrypt('integration-only'),
            'zone_id' => $fixture->zoneId,
            'status' => 1,
            'active' => 1,
            'type' => 'freelancer',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('orders')->where('id', $orderId)->update([
            'delivery_man_id' => $deliveryManId,
            'order_status' => 'picked_up',
            'accepted' => now()->subMinutes(12),
            'confirmed' => now()->subMinutes(10),
            'processing' => now()->subMinutes(8),
            'handover' => now()->subMinutes(6),
            'picked_up' => now()->subMinutes(4),
        ]);
        $historyId = DB::table('delivery_histories')->insertGetId([
            'order_id' => $orderId,
            'delivery_man_id' => $deliveryManId,
            'time' => now()->subMinute(),
            'latitude' => '17.385044',
            'longitude' => '78.486671',
            'location' => 'Synthetic tracking point',
            'created_at' => now()->subMinute(),
            'updated_at' => now()->subMinute(),
        ]);

        $tracking = app(CustomerOrderTrackingService::class);
        $snapshot = $tracking->show($fixture->customer, $orderId);

        $this->assertNotNull($snapshot);
        $this->assertSame('picked_up', $snapshot['status']);
        $this->assertFalse($snapshot['is_terminal']);
        $this->assertSame('placed', $snapshot['milestones'][0]['key']);
        $this->assertNotNull($snapshot['milestones'][4]['occurred_at']);
        $this->assertSame(17.385044, $snapshot['courier_location']['latitude']);
        $this->assertSame(78.486671, $snapshot['courier_location']['longitude']);
        $this->assertArrayNotHasKey('delivery_man_id', $snapshot);
        $this->assertArrayNotHasKey('location', $snapshot['courier_location']);
        $this->assertNull($tracking->show($fixture->otherCustomer, $orderId));

        DB::table('delivery_histories')->where('id', $historyId)->update([
            'time' => now()->subMinutes(11),
            'created_at' => now()->subMinutes(11),
        ]);
        $this->assertNull($tracking->show($fixture->customer, $orderId)['courier_location']);

        DB::table('orders')->where('id', $orderId)->update([
            'order_status' => 'delivered',
            'delivered' => now(),
        ]);
        $terminal = $tracking->show($fixture->customer, $orderId);
        $this->assertTrue($terminal['is_terminal']);
        $this->assertNull($terminal['courier_location']);
    }

    public function test_cod_order_rejects_changed_cart_without_order_side_effects(): void
    {
        $fixture = MobileCheckoutFixture::create();
        $quote = $this->quote($fixture, 'quote-order-stale-0001');
        DB::table('items')->where('id', $fixture->itemId)->update([
            'price' => 125,
            'updated_at' => now()->addSecond(),
        ]);

        try {
            app(CustomerCodOrderService::class)->submit(
                $fixture->customer,
                $quote->id,
                'order-stale-idempotency-0001',
                null,
            );
            $this->fail('Expected stale quote rejection.');
        } catch (CustomerOrderSubmissionException $error) {
            $this->assertContains($error->getMessage(), ['QUOTE_RECONCILIATION_REQUIRED', 'CART_CHANGED']);
        }
        $this->assertSame(0, DB::table('orders')->count());
        $this->assertSame(1, DB::table('carts')->where('id', $fixture->cartId)->count());
        $this->assertSame(0, DB::table('customer_order_submissions')->count());
    }

    public function test_address_contract_enforces_ownership_versions_and_default_invariant(): void
    {
        $fixture = MobileCheckoutFixture::create();
        $controller = app(CustomerAddressController::class);
        $address = CustomerAddress::findOrFail($fixture->addressId);
        $version = $address->updated_at->utc()->toIso8601String();

        $otherCustomerUpdate = $controller->update(
            $this->request($fixture->otherCustomer, $this->addressPayload([
                'version' => $version,
            ]), 'PUT'),
            $fixture->addressId,
        );
        $this->assertSame(
            404,
            $otherCustomerUpdate->status(),
            json_encode($otherCustomerUpdate->getData(true), JSON_THROW_ON_ERROR),
        );
        $this->assertSame('ADDRESS_NOT_FOUND', $otherCustomerUpdate->getData(true)['error']['code']);

        DB::table('customer_addresses')
            ->where('id', $fixture->addressId)
            ->update(['updated_at' => now()->addMinute()]);
        $staleUpdate = $controller->update(
            $this->request($fixture->customer, $this->addressPayload([
                'version' => $version,
            ]), 'PUT'),
            $fixture->addressId,
        );
        $this->assertSame(409, $staleUpdate->status());
        $this->assertSame('ADDRESS_VERSION_CONFLICT', $staleUpdate->getData(true)['error']['code']);

        $created = $controller->store(
            $this->request($fixture->customer, $this->addressPayload([
                'address_type' => 'work',
                'address' => 'Second synthetic address',
                'is_default' => true,
            ])),
        );
        $this->assertSame(201, $created->status());
        $createdAddress = $created->getData(true)['address'];
        $this->assertSame('Beside Metro pillar 18', $createdAddress['landmark']);
        $this->assertTrue($createdAddress['is_default']);
        $this->assertFalse((bool) CustomerAddress::findOrFail($fixture->addressId)->is_default);

        $deleted = $controller->destroy(
            $this->request($fixture->customer, ['version' => $createdAddress['version']], 'DELETE'),
            $createdAddress['id'],
        );
        $this->assertSame(200, $deleted->status());
        $this->assertTrue((bool) CustomerAddress::findOrFail($fixture->addressId)->is_default);
    }

    public function test_address_contract_rejects_coordinates_outside_the_service_area(): void
    {
        $fixture = MobileCheckoutFixture::create();
        $controller = app(CustomerAddressController::class);

        $response = $controller->store(
            $this->request($fixture->customer, $this->addressPayload([
                'latitude' => 16.5062,
                'longitude' => 80.6480,
            ])),
        );

        $this->assertSame(422, $response->status());
        $this->assertSame('DELIVERY_AREA_UNAVAILABLE', $response->getData(true)['error']['code']);
    }

    public function test_location_contract_normalizes_provider_data_and_checks_the_cart_module(): void
    {
        $fixture = MobileCheckoutFixture::create();
        BusinessSetting::updateOrCreate(
            ['key' => 'map_api_key_server'],
            ['value' => 'integration-server-key'],
        );
        Http::fake([
            'places.googleapis.com/v1/places:autocomplete' => Http::response([
                'suggestions' => [[
                    'placePrediction' => [
                        'placeId' => 'ChIJ-test-place',
                        'text' => ['text' => 'Madhapur, Hyderabad, Telangana, India'],
                        'structuredFormat' => [
                            'mainText' => ['text' => 'Madhapur'],
                            'secondaryText' => ['text' => 'Hyderabad, Telangana'],
                        ],
                    ],
                ]],
            ]),
            'places.googleapis.com/v1/places/*' => Http::response([
                'id' => 'ChIJ-test-place',
                'displayName' => ['text' => 'Madhapur'],
                'formattedAddress' => 'Madhapur, Hyderabad, Telangana, India',
                'location' => ['latitude' => 17.385, 'longitude' => 78.4867],
            ]),
            'maps.googleapis.com/maps/api/geocode/json*' => Http::response([
                'status' => 'OK',
                'results' => [[
                    'formatted_address' => 'Madhapur, Hyderabad, Telangana, India',
                ]],
            ]),
        ]);
        $controller = app(CustomerLocationController::class);
        $headers = ['HTTP_X_LOCALIZATION' => 'te'];

        $search = $controller->search($this->locationRequest($fixture->customer, [
            'query' => 'Madhapur',
            'session_token' => '0123456789abcdef0123456789abcdef',
            'latitude' => 17.385,
            'longitude' => 78.4867,
        ], $headers));
        $this->assertSame(200, $search->status());
        $this->assertSame('ChIJ-test-place', $search->getData(true)['suggestions'][0]['place_id']);

        $details = $controller->details($this->locationRequest($fixture->customer, [
            'session_token' => '0123456789abcdef0123456789abcdef',
        ], $headers), 'ChIJ-test-place');
        $this->assertSame(17.385, $details->getData(true)['place']['latitude']);

        $reverse = $controller->reverseGeocode($this->locationRequest($fixture->customer, [
            'latitude' => 17.385,
            'longitude' => 78.4867,
        ], $headers));
        $this->assertSame('Madhapur, Hyderabad, Telangana, India', $reverse->getData(true)['location']['formatted_address']);

        $serviceability = $controller->serviceability($this->locationRequest($fixture->customer, [
            'latitude' => 17.385,
            'longitude' => 78.4867,
            'module_id' => $fixture->moduleId,
        ]));
        $this->assertTrue($serviceability->getData(true)['serviceability']['available']);
        $this->assertSame($fixture->zoneId, $serviceability->getData(true)['serviceability']['zone_id']);

        Http::assertSent(function ($request) {
            if (! str_ends_with($request->url(), 'places:autocomplete')) {
                return false;
            }

            return $request['includedRegionCodes'] === ['in']
                && data_get($request->data(), 'languageCode') === 'te'
                && $request->hasHeader('X-Goog-Api-Key', 'integration-server-key')
                && ! str_contains(json_encode($request->data(), JSON_THROW_ON_ERROR), 'integration-server-key');
        });
    }

    public function test_quote_uses_authoritative_discount_tax_delivery_and_has_no_order_side_effects(): void
    {
        $fixture = MobileCheckoutFixture::create();
        $quote = $this->quote($fixture, 'quote-baseline-0001');

        $this->assertSame('INR', $quote->currency);
        $this->assertSame(20000, (int) $quote->subtotal_minor);
        $this->assertSame(2000, (int) $quote->discount_minor);
        $this->assertSame(900, (int) $quote->tax_minor);
        $this->assertSame(2500, (int) $quote->delivery_minor);
        $this->assertSame(21400, (int) $quote->total_minor);
        $this->assertSame(['cash_on_delivery'], $quote->snapshot['payment_methods']);
        $this->assertCount(1, $quote->snapshot['line_items']);
        $this->assertSame(0, DB::table('order_taxes')->count());
        $this->assertTrue($quote->expires_at->equalTo(now()->addMinutes(5)));

        DB::table('stores')->where('id', $fixture->storeId)->update(['free_delivery' => 1]);
        $freeDeliveryQuote = $this->quote($fixture, 'quote-free-delivery-0001');
        $this->assertSame(0, (int) $freeDeliveryQuote->delivery_minor);
        $this->assertSame(18900, (int) $freeDeliveryQuote->total_minor);
    }

    public function test_quote_replay_is_stable_and_a_new_key_reprices_changed_catalog_data(): void
    {
        $fixture = MobileCheckoutFixture::create();
        $service = app(CustomerCheckoutQuoteService::class);
        $key = 'quote-idempotency-0001';

        $first = $service->create(
            $fixture->customer,
            $fixture->addressId,
            $fixture->storeId,
            $fixture->moduleId,
            $key,
        );
        $replay = $service->create(
            $fixture->customer,
            $fixture->addressId,
            $fixture->storeId,
            $fixture->moduleId,
            $key,
        );
        $this->assertSame($first->id, $replay->id);
        $this->assertSame((int) $first->total_minor, (int) $replay->total_minor);

        DB::table('items')->where('id', $fixture->itemId)->update([
            'price' => 120,
            'updated_at' => now()->addSecond(),
        ]);
        $repriced = $this->quote($fixture, 'quote-repricing-0001');

        $this->assertSame(24000, (int) $repriced->subtotal_minor);
        $this->assertSame(2400, (int) $repriced->discount_minor);
        $this->assertSame(1080, (int) $repriced->tax_minor);
        $this->assertSame(25180, (int) $repriced->total_minor);
        $this->assertNotSame($first->cart_fingerprint, $repriced->cart_fingerprint);

        $this->assertQuoteError('IDEMPOTENCY_KEY_REUSED', function () use ($service, $fixture, $key) {
            $service->create(
                $fixture->customer,
                $fixture->addressId,
                $fixture->storeId + 1,
                $fixture->moduleId,
                $key,
            );
        }, 409);
    }

    public function test_quote_rejects_foreign_addresses_stock_changes_minimums_and_cod_limits(): void
    {
        $fixture = MobileCheckoutFixture::create();

        $foreignAddress = DB::table('customer_addresses')->insertGetId([
            'address_type' => 'home',
            'contact_person_number' => '+918888888888',
            'contact_person_name' => 'Other Customer',
            'address' => 'Foreign synthetic address',
            'latitude' => '17.3850',
            'longitude' => '78.4867',
            'user_id' => $fixture->otherCustomer->id,
            'zone_id' => $fixture->zoneId,
            'is_default' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->assertQuoteError('ADDRESS_NOT_FOUND', function () use ($fixture, $foreignAddress) {
            app(CustomerCheckoutQuoteService::class)->create(
                $fixture->customer,
                $foreignAddress,
                $fixture->storeId,
                $fixture->moduleId,
                'quote-foreign-address-0001',
            );
        }, 404);

        DB::table('items')->where('id', $fixture->itemId)->update(['stock' => 1]);
        $this->assertQuoteError('CART_ITEM_OUT_OF_STOCK', function () use ($fixture) {
            $this->quote($fixture, 'quote-stock-change-0001');
        }, 409);

        DB::table('items')->where('id', $fixture->itemId)->update(['stock' => 10]);
        DB::table('stores')->where('id', $fixture->storeId)->update(['minimum_order' => 201]);
        $this->assertQuoteError('MINIMUM_ORDER_NOT_MET', function () use ($fixture) {
            $this->quote($fixture, 'quote-minimum-order-0001');
        }, 422);

        DB::table('stores')->where('id', $fixture->storeId)->update(['minimum_order' => 100]);
        DB::table('module_zone')->where([
            'module_id' => $fixture->moduleId,
            'zone_id' => $fixture->zoneId,
        ])->update(['maximum_cod_order_amount' => 100]);
        $this->assertQuoteError('PAYMENT_UNAVAILABLE', function () use ($fixture) {
            $this->quote($fixture, 'quote-cod-limit-0001');
        }, 422);
    }

    public function test_expired_idempotent_replay_remains_the_same_immutable_quote(): void
    {
        $fixture = MobileCheckoutFixture::create();
        $service = app(CustomerCheckoutQuoteService::class);
        $key = 'quote-expiry-replay-0001';
        $quote = $service->create(
            $fixture->customer,
            $fixture->addressId,
            $fixture->storeId,
            $fixture->moduleId,
            $key,
        );

        Carbon::setTestNow(now()->addMinutes(6));
        $replay = $service->create(
            $fixture->customer,
            $fixture->addressId,
            $fixture->storeId,
            $fixture->moduleId,
            $key,
        );

        $this->assertSame($quote->id, $replay->id);
        $this->assertTrue($replay->expires_at->isPast());
        $this->assertSame(1, DB::table('customer_checkout_quotes')->count());
    }

    private function quote(MobileCheckoutFixture $fixture, string $key)
    {
        return app(CustomerCheckoutQuoteService::class)->create(
            $fixture->customer,
            $fixture->addressId,
            $fixture->storeId,
            $fixture->moduleId,
            $key,
        );
    }

    private function assertQuoteError(
        string $code,
        callable $operation,
        int $status,
    ): void {
        try {
            $operation();
            $this->fail("Expected checkout quote error [{$code}].");
        } catch (CheckoutQuoteException $error) {
            $this->assertSame($code, $error->getMessage());
            $this->assertSame($status, $error->status);
        }
    }

    private function request(User $user, array $payload, string $method = 'POST'): Request
    {
        $request = Request::create('/api/v2/customer/addresses', $method, $payload);
        $request->setUserResolver(fn () => $user);

        return $request;
    }

    private function locationRequest(User $user, array $payload, array $server = []): Request
    {
        $request = Request::create('/api/v2/customer/locations', 'GET', $payload, [], [], $server);
        $request->setUserResolver(fn () => $user);

        return $request;
    }

    private function addressPayload(array $overrides = []): array
    {
        return [
            'contact_person_name' => 'Integration Customer',
            'contact_person_number' => '+919999999999',
            'address_type' => 'home',
            'address' => 'Synthetic Hyderabad address',
            'floor' => '1',
            'road' => 'Integration Road',
            'landmark' => 'Beside Metro pillar 18',
            'house' => 'TEST-1',
            'latitude' => 17.3850,
            'longitude' => 78.4867,
            ...$overrides,
        ];
    }
}
