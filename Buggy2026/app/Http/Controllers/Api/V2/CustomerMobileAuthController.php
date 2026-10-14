<?php

namespace App\Http\Controllers\Api\V2;

use App\CentralLogics\Helpers;
use App\CentralLogics\SMS_module;
use App\Http\Controllers\Controller;
use App\Mail\EmailVerification;
use App\Models\BusinessSetting;
use App\Models\Guest;
use App\Models\User;
use App\Models\WalletTransaction;
use App\Services\CustomerMobileSessionService;
use App\Services\CustomerPushDeviceService;
use App\Services\GuestCartMigrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Modules\Gateways\Traits\SmsGateway;
use RuntimeException;

class CustomerMobileAuthController extends Controller
{
    public function guest(
        Request $request,
        GuestCartMigrationService $migrationService
    ): JsonResponse {
        $validator = Validator::make($request->all(), [
            'fcm_token' => 'nullable|string|max:255',
        ]);
        if ($validator->fails()) {
            return $this->validationError($validator->errors()->toArray());
        }

        $guest = new Guest();
        $guest->ip_address = $request->ip();
        $guest->fcm_token = $request->input('fcm_token');
        $guest->save();

        return response()->json([
            'guest_id' => $guest->id,
            'migration_token' => $migrationService->issueToken($guest),
        ], 201, ['Cache-Control' => 'no-store']);
    }

    public function register(
        Request $request,
        CustomerMobileSessionService $sessionService,
        GuestCartMigrationService $migrationService
    ): JsonResponse {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'phone' => 'required|string|min:8|max:20|unique:users,phone',
            'email' => 'nullable|string|email|max:254|unique:users,email',
            'password' => 'required|string|min:8|max:200',
            'installation_id' => ['required', 'regex:/^[a-f0-9]{32}$/'],
            'guest_id' => 'nullable|integer|min:1',
            'guest_migration_token' => 'required_with:guest_id|string|max:2048',
            'ref_code' => 'nullable|string|max:50',
        ]);
        if ($validator->fails()) {
            $errors = $validator->errors();
            if ($errors->has('phone')) {
                foreach ($errors->get('phone') as $msg) {
                    if (str_contains(strtolower($msg), 'already been taken') || str_contains(strtolower($msg), 'taken')) {
                        return $this->error('PHONE_EXISTS', 409);
                    }
                }
            }
            if ($errors->has('email')) {
                foreach ($errors->get('email') as $msg) {
                    if (str_contains(strtolower($msg), 'already been taken') || str_contains(strtolower($msg), 'taken')) {
                        return $this->error('EMAIL_EXISTS', 409);
                    }
                }
            }
            return $this->validationError($validator->errors()->toArray());
        }

        $ref_by = null;
        if ($request->filled('ref_code')) {
            $refStatus = BusinessSetting::where('key', 'ref_earning_status')->first()?->value;
            if ($refStatus != '1') {
                return $this->error('REFERRAL_DISABLED', 403);
            }

            $referrerUser = User::where('ref_code', $request->input('ref_code'))->first();
            if (!$referrerUser || !$referrerUser->status) {
                return $this->error('INVALID_REFERRAL_CODE', 422);
            }

            if (WalletTransaction::where('reference', $request->input('phone'))->first()) {
                return $this->error('REFERRAL_ALREADY_USED', 409);
            }

            $ref_by = $referrerUser->id;
        }

        $name = trim((string) $request->input('name'));
        $nameParts = explode(' ', $name, 2);
        $firstName = $nameParts[0];
        $lastName = $nameParts[1] ?? '';

        $loginSettings = array_column(
            BusinessSetting::whereIn('key', [
                'phone_verification_status',
                'email_verification_status',
                'send_otp_via',
                'firebase_otp_verification',
            ])->get(['key', 'value'])->toArray(),
            'value',
            'key'
        );
        $needsPhoneVerification = (int) ($loginSettings['phone_verification_status'] ?? 0) === 1;
        $needsEmailVerification = !$needsPhoneVerification && (int) ($loginSettings['email_verification_status'] ?? 0) === 1;

        DB::beginTransaction();
        try {
            $user = User::create([
                'f_name' => $firstName,
                'l_name' => $lastName,
                'email' => $request->filled('email') ? trim((string) $request->input('email')) : null,
                'phone' => trim((string) $request->input('phone')),
                'password' => Hash::make((string) $request->input('password')),
                'ref_by' => $ref_by,
                'status' => 1,
                'tenant_id' => 0,
                'sub_tenant_id' => 0,
                'is_phone_verified' => $needsPhoneVerification ? 0 : 1,
                'is_email_verified' => $needsEmailVerification ? 0 : 1,
            ]);
            $user->ref_code = Helpers::generate_referer_code($user);
            $user->save();

            if ($request->filled('guest_id')) {
                $migrationService->migrate(
                    $user,
                    (int) $request->input('guest_id'),
                    (string) $request->input('guest_migration_token')
                );
            }

            DB::commit();
        } catch (RuntimeException $e) {
            DB::rollBack();
            if ($e->getMessage() === 'INVALID_GUEST_SESSION') {
                return $this->error('INVALID_GUEST_SESSION', 409);
            }
            return $this->error('ACCOUNT_CREATION_FAILED', 500);
        } catch (\Throwable $e) {
            DB::rollBack();
            return $this->error('ACCOUNT_CREATION_FAILED', 500);
        }

        if ($ref_by && isset($referrerUser)) {
            $notificationData = [
                'title' => translate('messages.Your_referral_code_is_used_by') . ' ' . $firstName . ' ' . $lastName,
                'description' => translate('Be prepare to receive when they complete there first purchase'),
                'order_id' => 1,
                'image' => '',
                'type' => 'referral_code',
            ];
            if (Helpers::getNotificationStatusData('customer', 'customer_new_referral_join', 'push_notification_status') && $referrerUser->cm_firebase_token) {
                Helpers::send_push_notif_to_device($referrerUser->cm_firebase_token, $notificationData);
                DB::table('user_notifications')->insert([
                    'data' => json_encode($notificationData),
                    'user_id' => $referrerUser->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        try {
            $notificationStatus = Helpers::getNotificationStatusData('customer', 'customer_registration', 'mail_status');
            if ($notificationStatus && config('mail.status') && $user->email && Helpers::get_mail_status('registration_mail_status_user') == '1') {
                Mail::to($user->email)->send(new \App\Mail\CustomerRegistration($user->f_name . ' ' . $user->l_name));
            }
        } catch (\Throwable $ex) {
            info($ex->getMessage());
        }

        if ($needsPhoneVerification) {
            $otp = getEnvMode() === 'test' ? '123456' : (string) rand(100000, 999999);
            DB::table('phone_verifications')->updateOrInsert(
                ['phone' => $user->phone, 'tenant_id' => 0, 'sub_tenant_id' => 0],
                ['token' => $otp, 'otp_hit_count' => 0, 'created_at' => now(), 'updated_at' => now()]
            );

            $firebaseOtp = (int) ($loginSettings['firebase_otp_verification'] ?? 0);
            if (!$firebaseOtp || data_get($loginSettings, 'send_otp_via') === 'sms') {
                if (config('get_payment_publish_status')[0]['is_published'] ?? 0 == 1) {
                    SmsGateway::send($user->phone, $otp);
                } else {
                    SMS_module::send($user->phone, $otp);
                }
            }

            return response()->json([
                'requires_verification' => true,
                'verification_type' => 'phone',
                'customer' => [
                    'id' => $user->id,
                    'first_name' => $user->f_name,
                    'last_name' => $user->l_name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                ],
            ], 201, ['Cache-Control' => 'no-store, private']);
        }

        if ($needsEmailVerification && $user->email) {
            $otp = getEnvMode() === 'test' ? '123456' : (string) rand(100000, 999999);
            DB::table('email_verifications')->updateOrInsert(
                ['email' => $user->email, 'tenant_id' => 0, 'sub_tenant_id' => 0],
                ['token' => $otp, 'created_at' => now(), 'updated_at' => now()]
            );

            try {
                if (config('mail.status') && Helpers::get_mail_status('registration_otp_mail_status_user') == '1') {
                    Mail::to($user->email)->send(new EmailVerification($otp, $name));
                }
            } catch (\Throwable $ex) {
                info($ex->getMessage());
            }

            return response()->json([
                'requires_verification' => true,
                'verification_type' => 'email',
                'customer' => [
                    'id' => $user->id,
                    'first_name' => $user->f_name,
                    'last_name' => $user->l_name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                ],
            ], 201, ['Cache-Control' => 'no-store, private']);
        }

        $tokens = $sessionService->issue(
            $user,
            (string) $request->input('installation_id')
        );

        return response()->json([
            ...$tokens,
            'customer' => [
                'id' => $user->id,
                'first_name' => $user->f_name,
                'last_name' => $user->l_name,
                'email' => $user->email,
                'phone' => $user->phone,
            ],
        ], 201, ['Cache-Control' => 'no-store, private']);
    }

    public function login(
        Request $request,
        CustomerMobileSessionService $sessionService,
        GuestCartMigrationService $migrationService
    ): JsonResponse {
        $validator = Validator::make($request->all(), [
            'email_or_phone' => 'required|string|max:254',
            'password' => 'required|string|min:6|max:200',
            'installation_id' => ['required', 'regex:/^[a-f0-9]{32}$/'],
            'guest_id' => 'nullable|integer|min:1',
            'guest_migration_token' => 'required_with:guest_id|string|max:2048',
        ]);
        if ($validator->fails()) {
            return $this->validationError($validator->errors()->toArray());
        }

        $identifier = trim((string) $request->input('email_or_phone'));
        $field = filter_var($identifier, FILTER_VALIDATE_EMAIL)
            ? 'email'
            : 'phone';
        $user = User::where($field, $identifier)->first();
        if (!$user || !Hash::check((string) $request->input('password'), $user->password)) {
            return $this->error('INVALID_CREDENTIALS', 401);
        }
        if (!$user->status) {
            return $this->error('ACCOUNT_BLOCKED', 403);
        }

        if ($request->filled('guest_id')) {
            try {
                $migrationService->migrate(
                    $user,
                    (int) $request->input('guest_id'),
                    (string) $request->input('guest_migration_token')
                );
            } catch (RuntimeException) {
                return $this->error('INVALID_GUEST_SESSION', 409);
            }
        }

        $tokens = $sessionService->issue(
            $user,
            (string) $request->input('installation_id')
        );

        return response()->json([
            ...$tokens,
            'customer' => [
                'id' => $user->id,
                'first_name' => $user->f_name,
                'last_name' => $user->l_name,
                'email' => $user->email,
                'phone' => $user->phone,
            ],
        ], 200, ['Cache-Control' => 'no-store, private']);
    }

    public function refresh(
        Request $request,
        CustomerMobileSessionService $sessionService
    ): JsonResponse {
        $validator = Validator::make($request->all(), [
            'refresh_token' => 'required|string|size:64',
            'installation_id' => ['required', 'regex:/^[a-f0-9]{32}$/'],
        ]);
        if ($validator->fails()) {
            return $this->validationError($validator->errors()->toArray());
        }

        try {
            $tokens = $sessionService->rotate(
                (string) $request->input('refresh_token'),
                (string) $request->input('installation_id')
            );
        } catch (RuntimeException $error) {
            $status = $error->getMessage() === 'ACCOUNT_UNAVAILABLE' ? 403 : 401;
            return $this->error($error->getMessage(), $status);
        }

        return response()->json(
            $tokens,
            200,
            ['Cache-Control' => 'no-store, private']
        );
    }

    public function logout(
        Request $request,
        CustomerMobileSessionService $sessionService,
        CustomerPushDeviceService $pushDevices,
    ): JsonResponse {
        $validator = Validator::make($request->all(), [
            'installation_id' => ['nullable', 'regex:/^[a-f0-9]{32}$/'],
        ]);
        if ($validator->fails()) {
            return $this->validationError($validator->errors()->toArray());
        }

        if ($request->filled('installation_id')) {
            $pushDevices->unregister(
                $request->user(),
                (string) $request->input('installation_id')
            );
        }
        $accessToken = $request->user()?->token();
        $sessionService->revokeForAccessToken($accessToken?->id);

        return response()->json(
            ['success' => true],
            200,
            ['Cache-Control' => 'no-store']
        );
    }

    private function validationError(array $fields): JsonResponse
    {
        return response()->json([
            'error' => [
                'code' => 'VALIDATION_FAILED',
                'fields' => array_map(
                    fn (array $messages) => $messages[0] ?? 'INVALID',
                    $fields
                ),
            ],
        ], 422, ['Cache-Control' => 'no-store']);
    }

    private function error(string $code, int $status): JsonResponse
    {
        return response()->json([
            'error' => ['code' => $code],
        ], $status, ['Cache-Control' => 'no-store']);
    }
}
