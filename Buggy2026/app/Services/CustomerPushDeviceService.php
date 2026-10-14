<?php

namespace App\Services;

use App\Models\CustomerPushDevice;
use App\Models\User;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class CustomerPushDeviceService
{
    public function register(
        User $user,
        string $installationId,
        string $token,
        string $platform,
        ?string $locale,
    ): void {
        $installationHash = hash('sha256', $installationId);
        $tokenHash = hash('sha256', $token);

        DB::transaction(function () use (
            $user,
            $installationHash,
            $tokenHash,
            $token,
            $platform,
            $locale,
        ) {
            CustomerPushDevice::query()
                ->where('token_hash', $tokenHash)
                ->where(function ($query) use ($user, $installationHash) {
                    $query->where('user_id', '!=', $user->id)
                        ->orWhere('installation_id_hash', '!=', $installationHash);
                })
                ->delete();

            CustomerPushDevice::query()->updateOrCreate(
                [
                    'user_id' => $user->id,
                    'installation_id_hash' => $installationHash,
                ],
                [
                    'tenant_id' => (int) ($user->tenant_id ?? 0),
                    'sub_tenant_id' => (int) ($user->sub_tenant_id ?? 0),
                    'token_hash' => $tokenHash,
                    'token_ciphertext' => Crypt::encryptString($token),
                    'platform' => $platform,
                    'locale' => $locale,
                    'last_seen_at' => now(),
                    'disabled_at' => null,
                ]
            );

            // Preserve the host pipeline while notification senders migrate
            // from the legacy single-token column to the device registry.
            User::query()->whereKey($user->id)->update([
                'cm_firebase_token' => $token,
            ]);
        });
    }

    public function unregister(User $user, string $installationId): void
    {
        if (! Schema::hasTable('customer_push_devices')) {
            return;
        }

        DB::transaction(function () use ($user, $installationId) {
            $device = CustomerPushDevice::query()
                ->where('user_id', $user->id)
                ->where('installation_id_hash', hash('sha256', $installationId))
                ->lockForUpdate()
                ->first();

            if (! $device) {
                return;
            }

            $removedToken = $this->decrypt($device->token_ciphertext);
            $device->delete();

            $currentToken = User::query()
                ->whereKey($user->id)
                ->value('cm_firebase_token');
            if ($removedToken !== null && hash_equals(
                hash('sha256', (string) $currentToken),
                hash('sha256', $removedToken)
            )) {
                User::query()->whereKey($user->id)->update([
                    'cm_firebase_token' => $this->activeTokensFor($user, false)[0] ?? null,
                ]);
            }
        });
    }

    /** @return list<string> */
    public function activeTokensFor(User $user, bool $includeLegacy = true): array
    {
        $tokens = [];
        if (Schema::hasTable('customer_push_devices')) {
            $devices = CustomerPushDevice::query()
                ->where('user_id', $user->id)
                ->whereNull('disabled_at')
                ->orderByDesc('last_seen_at')
                ->limit(10)
                ->get(['token_ciphertext']);

            foreach ($devices as $device) {
                $token = $this->decrypt($device->token_ciphertext);
                if ($token !== null) {
                    $tokens[] = $token;
                }
            }
        }

        if ($includeLegacy && is_string($user->cm_firebase_token)
            && trim($user->cm_firebase_token) !== '') {
            $tokens[] = $user->cm_firebase_token;
        }

        return array_values(array_unique($tokens));
    }

    private function decrypt(string $ciphertext): ?string
    {
        try {
            $token = Crypt::decryptString($ciphertext);

            return trim($token) === '' ? null : $token;
        } catch (Throwable) {
            return null;
        }
    }
}
