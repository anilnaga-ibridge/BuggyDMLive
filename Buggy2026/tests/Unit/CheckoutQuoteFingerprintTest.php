<?php

namespace Tests\Unit;

use App\Services\CheckoutQuoteFingerprint;
use PHPUnit\Framework\TestCase;

class CheckoutQuoteFingerprintTest extends TestCase
{
    public function test_object_key_order_does_not_change_the_fingerprint(): void
    {
        $fingerprint = new CheckoutQuoteFingerprint();

        $first = $fingerprint->hash([
            'store_id' => 8,
            'cart' => [['item_id' => 4, 'quantity' => 2]],
            'address_id' => 3,
        ]);
        $second = $fingerprint->hash([
            'address_id' => 3,
            'cart' => [['quantity' => 2, 'item_id' => 4]],
            'store_id' => 8,
        ]);

        self::assertSame($first, $second);
        self::assertSame(64, strlen($first));
    }

    public function test_material_cart_change_changes_the_fingerprint(): void
    {
        $fingerprint = new CheckoutQuoteFingerprint();

        self::assertNotSame(
            $fingerprint->hash(['cart' => [['item_id' => 4, 'quantity' => 1]]]),
            $fingerprint->hash(['cart' => [['item_id' => 4, 'quantity' => 2]]]),
        );
    }
}
