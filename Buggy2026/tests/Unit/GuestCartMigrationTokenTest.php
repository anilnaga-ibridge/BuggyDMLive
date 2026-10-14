<?php

namespace Tests\Unit;

use App\Models\Guest;
use App\Services\GuestCartMigrationService;
use Illuminate\Support\Facades\Crypt;
use Tests\TestCase;

class GuestCartMigrationTokenTest extends TestCase
{
    public function test_token_is_opaque_authenticated_and_bound_to_the_guest(): void
    {
        $guest = new Guest();
        $guest->id = 338;

        $token = app(GuestCartMigrationService::class)->issueToken($guest);
        $payload = json_decode(Crypt::decryptString($token), true, 8, JSON_THROW_ON_ERROR);

        $this->assertStringNotContainsString('338', $token);
        $this->assertSame(1, $payload['version']);
        $this->assertSame(338, $payload['guest_id']);
        $this->assertGreaterThan(now()->timestamp, $payload['expires_at']);
    }
}
