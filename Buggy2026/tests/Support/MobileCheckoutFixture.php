<?php

namespace Tests\Support;

use App\Models\User;
use Illuminate\Support\Facades\DB;

final class MobileCheckoutFixture
{
    public function __construct(
        public readonly User $customer,
        public readonly User $otherCustomer,
        public readonly int $zoneId,
        public readonly int $moduleId,
        public readonly int $storeId,
        public readonly int $categoryId,
        public readonly int $itemId,
        public readonly int $cartId,
        public readonly int $addressId,
    ) {}

    public static function create(): self
    {
        $now = now();
        $suffix = str_replace('.', '', uniqid('', true));

        $customerId = DB::table('users')->insertGetId([
            'f_name' => 'Integration',
            'l_name' => 'Customer',
            'phone' => '+919000'.substr($suffix, -6),
            'email' => "mobile.{$suffix}@example.test",
            'status' => 1,
            'order_count' => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $otherCustomerId = DB::table('users')->insertGetId([
            'f_name' => 'Other',
            'l_name' => 'Customer',
            'phone' => '+918000'.substr($suffix, -6),
            'email' => "other.{$suffix}@example.test",
            'status' => 1,
            'order_count' => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $zoneId = DB::table('zones')->insertGetId([
            'name' => "Integration Zone {$suffix}",
            'display_name' => 'Hyderabad test zone',
            'coordinates' => DB::raw(
                "ST_GeomFromText('POLYGON((78.40 17.30,78.60 17.30,78.60 17.50,78.40 17.50,78.40 17.30))', 0)"
            ),
            'status' => 1,
            'cash_on_delivery' => 1,
            'digital_payment' => 0,
            'offline_payment' => 0,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $moduleId = DB::table('modules')->insertGetId([
            'module_name' => "Integration Grocery {$suffix}",
            'module_type' => 'grocery',
            'status' => 1,
            'stores_count' => 1,
            'theme_id' => 1,
            'all_zone_service' => 0,
            'slug' => "integration-grocery-{$suffix}",
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('module_zone')->insert([
            'module_id' => $moduleId,
            'zone_id' => $zoneId,
            'delivery_charge_type' => 'fixed',
            'fixed_shipping_charge' => 25,
            'per_km_shipping_charge' => 0,
            'minimum_shipping_charge' => 0,
            'maximum_shipping_charge' => 0,
            'maximum_cod_order_amount' => 500,
        ]);

        $storeId = DB::table('stores')->insertGetId([
            'name' => "Integration Store {$suffix}",
            'phone' => '+917000'.substr($suffix, -6),
            'email' => "store.{$suffix}@example.test",
            'latitude' => '17.3850',
            'longitude' => '78.4867',
            'address' => 'Synthetic integration address',
            'minimum_order' => 100,
            'status' => 1,
            'vendor_id' => 900000,
            'delivery' => 1,
            'active' => 1,
            'zone_id' => $zoneId,
            'module_id' => $moduleId,
            'self_delivery_system' => 0,
            'store_business_model' => 'commission',
            'comment' => 'Synthetic integration fixture',
            'tin' => 'TEST-TIN',
            'tin_expire_date' => '2099-12-31',
            'tin_certificate_image' => 'integration-only.png',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('store_schedule')->insert([
            'store_id' => $storeId,
            'day' => $now->dayOfWeek,
            'opening_time' => '00:00:00',
            'closing_time' => '23:59:59',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $categoryId = DB::table('categories')->insertGetId([
            'name' => "Integration Category {$suffix}",
            'parent_id' => 0,
            'position' => 0,
            'status' => 1,
            'priority' => 0,
            'module_id' => $moduleId,
            'slug' => "integration-category-{$suffix}",
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $itemId = DB::table('items')->insertGetId([
            'name' => 'Synthetic Rice Pack',
            'category_id' => $categoryId,
            'price' => 100,
            'tax' => 0,
            'tax_type' => 'percent',
            'discount' => 10,
            'discount_type' => 'percent',
            'status' => 1,
            'store_id' => $storeId,
            'module_id' => $moduleId,
            'stock' => 10,
            'is_approved' => 1,
            'temp_zone' => 'Ambient',
            'volume_cm3' => 1000,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $cartId = DB::table('carts')->insertGetId([
            'user_id' => $customerId,
            'module_id' => $moduleId,
            'store_id' => $storeId,
            'item_id' => $itemId,
            'is_guest' => 0,
            'add_on_ids' => json_encode([]),
            'add_on_qtys' => json_encode([]),
            'item_type' => 'AppModelsItem',
            'price' => 100,
            'quantity' => 2,
            'variation' => json_encode([]),
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $addressId = DB::table('customer_addresses')->insertGetId([
            'address_type' => 'home',
            'contact_person_number' => '+919999999999',
            'contact_person_name' => 'Integration Customer',
            'address' => 'Synthetic Hyderabad address',
            'latitude' => '17.3850',
            'longitude' => '78.4867',
            'user_id' => $customerId,
            'zone_id' => $zoneId,
            'is_default' => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('business_settings')->insert([
            ['key' => 'currency', 'value' => 'INR', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'cash_on_delivery', 'value' => json_encode(['status' => 1]), 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'digital_payment', 'value' => json_encode(['status' => 0]), 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'offline_payment_status', 'value' => '0', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'admin_free_delivery_status', 'value' => '0', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'admin_free_delivery_option', 'value' => '', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'free_delivery_over', 'value' => '0', 'created_at' => $now, 'updated_at' => $now],
        ]);

        $taxId = DB::table('taxes')->insertGetId([
            'name' => 'Synthetic GST',
            'tax_rate' => 5,
            'is_default' => 1,
            'is_active' => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        DB::table('system_tax_setups')->insert([
            'tax_type' => 'order_wise',
            'tax_payer' => 'vendor',
            'tax_ids' => json_encode([$taxId]),
            'is_default' => 1,
            'is_active' => 1,
            'is_included' => 0,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return new self(
            User::findOrFail($customerId),
            User::findOrFail($otherCustomerId),
            $zoneId,
            $moduleId,
            $storeId,
            $categoryId,
            $itemId,
            $cartId,
            $addressId,
        );
    }
}
