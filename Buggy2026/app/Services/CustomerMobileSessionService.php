<?php

namespace App\Services;

use App\Models\CustomerMobileSession;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class CustomerMobileSessionService
{
    private const ACCESS_TOKEN_MINUTES = 15;
    private const REFRESH_TOKEN_DAYS = 30;

    public function issue(User $user, string $installationId): array
    {
        return DB::transaction(function () use ($user, $installationId) {
            CustomerMobileSession::where('user_id', $user->id)
                ->where('installation_id_hash', $this->installationHash($installationId))
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);

            return $this->createTokens($user, $installationId);
        });
    }

    public function rotate(string $refreshToken, string $installationId): array
    {
        return DB::transaction(function () use ($refreshToken, $installationId) {
            $session = CustomerMobileSession::where(
                'refresh_token_hash',
                hash('sha256', $refreshToken)
            )->lockForUpdate()->first();

            if (!$session || $session->revoked_at || $session->expires_at->isPast()) {
                throw new RuntimeException('INVALID_REFRESH_TOKEN');
            }
            if (!hash_equals(
                $session->installation_id_hash,
                $this->installationHash($installationId)
            )) {
                throw new RuntimeException('INVALID_REFRESH_TOKEN');
            }

            $user = User::find($session->user_id);
            if (!$user || !$user->status) {
                $session->update(['revoked_at' => now()]);
                throw new RuntimeException('ACCOUNT_UNAVAILABLE');
            }

            $this->revokeAccessToken($session->access_token_id);
            $session->update(['revoked_at' => now(), 'last_used_at' => now()]);

            return $this->createTokens($user, $installationId);
        });
    }

    public function revokeForAccessToken(?string $accessTokenId): void
    {
        if (!$accessTokenId) {
            return;
        }

        DB::transaction(function () use ($accessTokenId) {
            CustomerMobileSession::where('access_token_id', $accessTokenId)
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now(), 'last_used_at' => now()]);
            $this->revokeAccessToken($accessTokenId);
        });
    }

    private function createTokens(User $user, string $installationId): array
    {
        $tokenResult = $user->createToken('BuggyCustomerMobile');
        $accessExpiresAt = now()->addMinutes(self::ACCESS_TOKEN_MINUTES);
        $tokenResult->token->expires_at = $accessExpiresAt;
        $tokenResult->token->save();

        $refreshToken = $this->opaqueToken();
        $refreshExpiresAt = now()->addDays(self::REFRESH_TOKEN_DAYS);
        CustomerMobileSession::create([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'tenant_id' => (int) ($user->tenant_id ?? 0),
            'sub_tenant_id' => (int) ($user->sub_tenant_id ?? 0),
            'installation_id_hash' => $this->installationHash($installationId),
            'refresh_token_hash' => hash('sha256', $refreshToken),
            'access_token_id' => $tokenResult->token->id,
            'last_used_at' => now(),
            'expires_at' => $refreshExpiresAt,
        ]);

        return [
            'token_type' => 'Bearer',
            'access_token' => $tokenResult->accessToken,
            'refresh_token' => $refreshToken,
            'access_token_expires_at' => $accessExpiresAt->utc()->toIso8601String(),
            'refresh_token_expires_at' => $refreshExpiresAt->utc()->toIso8601String(),
        ];
    }

    private function revokeAccessToken(?string $accessTokenId): void
    {
        if ($accessTokenId) {
            DB::table('oauth_access_tokens')
                ->where('id', $accessTokenId)
                ->update(['revoked' => true]);
        }
    }

    private function installationHash(string $installationId): string
    {
        return hash('sha256', $installationId);
    }

    private function opaqueToken(): string
    {
        return rtrim(strtr(base64_encode(random_bytes(48)), '+/', '-_'), '=');
    }
}
