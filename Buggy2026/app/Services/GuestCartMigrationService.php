<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Guest;
use App\Models\User;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class GuestCartMigrationService
{
    private const TOKEN_MINUTES = 60 * 24 * 30;

    public function issueToken(Guest $guest): string
    {
        return Crypt::encryptString(json_encode([
            'version' => 1,
            'guest_id' => $guest->id,
            'expires_at' => now()->addMinutes(self::TOKEN_MINUTES)->timestamp,
        ], JSON_THROW_ON_ERROR));
    }

    public function migrate(
        User $user,
        int $guestId,
        string $migrationToken
    ): void {
        $this->assertToken($guestId, $migrationToken);

        DB::transaction(function () use ($user, $guestId) {
            $guest = Guest::where('id', $guestId)->lockForUpdate()->first();
            if (!$guest) {
                throw new RuntimeException('INVALID_GUEST_SESSION');
            }

            $guestCartExists = Cart::where([
                'user_id' => $guestId,
                'is_guest' => 1,
            ])->exists();
            if ($guestCartExists) {
                Cart::where([
                    'user_id' => $user->id,
                    'is_guest' => 0,
                ])->delete();
                Cart::where([
                    'user_id' => $guestId,
                    'is_guest' => 1,
                ])->update([
                    'user_id' => $user->id,
                    'is_guest' => 0,
                ]);
            }
        });
    }

    private function assertToken(int $guestId, string $migrationToken): void
    {
        try {
            $payload = json_decode(
                Crypt::decryptString($migrationToken),
                true,
                8,
                JSON_THROW_ON_ERROR
            );
        } catch (DecryptException|\JsonException) {
            throw new RuntimeException('INVALID_GUEST_SESSION');
        }

        if (
            !is_array($payload) ||
            ($payload['version'] ?? null) !== 1 ||
            (int) ($payload['guest_id'] ?? 0) !== $guestId ||
            (int) ($payload['expires_at'] ?? 0) <= now()->timestamp
        ) {
            throw new RuntimeException('INVALID_GUEST_SESSION');
        }
    }
}
