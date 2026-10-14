<?php

namespace App\Http\Controllers\Api\V2;

use App\Exceptions\CustomerOrderSubmissionException;
use App\Http\Controllers\Controller;
use App\Services\CustomerCodOrderService;
use App\Services\CustomerOrderReadService;
use App\Services\CustomerOrderTrackingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CustomerOrderController extends Controller
{
    public function index(Request $request, CustomerOrderReadService $orders): JsonResponse
    {
        $validator = Validator::make($request->query(), [
            'limit' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'cursor' => ['sometimes', 'integer', 'min:1'],
            'filter' => ['sometimes', 'in:all,active,past'],
        ]);
        if ($validator->fails()) {
            return $this->validationError($validator->errors()->toArray());
        }

        $page = $orders->index(
            $request->user(),
            (int) $request->query('limit', 20),
            $request->filled('cursor') ? (int) $request->query('cursor') : null,
            (string) $request->query('filter', 'all'),
        );

        return response()->json($page, 200, [
            'Cache-Control' => 'no-store, private',
        ]);
    }

    public function show(Request $request, int $id, CustomerOrderReadService $orders): JsonResponse
    {
        $order = $orders->show($request->user(), $id);
        if ($order === null) {
            return response()->json(
                ['error' => ['code' => 'ORDER_NOT_FOUND']],
                404,
                ['Cache-Control' => 'no-store']
            );
        }

        return response()->json(['order' => $order], 200, [
            'Cache-Control' => 'no-store, private',
        ]);
    }

    public function tracking(Request $request, int $id, CustomerOrderTrackingService $tracking): JsonResponse
    {
        $snapshot = $tracking->show($request->user(), $id);
        if ($snapshot === null) {
            return response()->json(
                ['error' => ['code' => 'ORDER_NOT_FOUND']],
                404,
                ['Cache-Control' => 'no-store']
            );
        }

        return response()->json(['tracking' => $snapshot], 200, [
            'Cache-Control' => 'no-store, private',
        ]);
    }

    public function store(Request $request, CustomerCodOrderService $orders): JsonResponse
    {
        $validator = Validator::make([
            ...$request->all(),
            'idempotency_key' => $request->header('Idempotency-Key'),
        ], [
            'quote_token' => ['required', 'uuid'],
            'payment_method' => ['required', 'in:cash_on_delivery'],
            'delivery_instruction' => ['nullable', 'string', 'max:1000'],
            'idempotency_key' => ['required', 'string', 'min:16', 'max:100', 'regex:/^[A-Za-z0-9._:-]+$/'],
        ]);
        if ($validator->fails()) {
            return $this->validationError($validator->errors()->toArray());
        }

        try {
            $result = $orders->submit(
                $request->user(),
                (string) $request->input('quote_token'),
                (string) $request->header('Idempotency-Key'),
                $request->filled('delivery_instruction')
                    ? trim((string) $request->input('delivery_instruction'))
                    : null,
            );
        } catch (CustomerOrderSubmissionException $error) {
            return response()->json(
                ['error' => ['code' => $error->getMessage()]],
                $error->status,
                ['Cache-Control' => 'no-store']
            );
        }

        return response()->json($result['body'], $result['status'], [
            'Cache-Control' => 'no-store, private',
            'Idempotent-Replay' => $result['replayed'] ? 'true' : 'false',
        ]);
    }

    public function recover(Request $request, CustomerCodOrderService $orders): JsonResponse
    {
        $key = (string) $request->header('Idempotency-Key');
        if (! preg_match('/^[A-Za-z0-9._:-]{16,100}$/', $key)) {
            return $this->validationError(['idempotency_key' => ['INVALID']]);
        }
        $result = $orders->recover($request->user(), $key);
        if ($result === null) {
            return response()->json(
                ['recovery' => ['status' => 'not_found']],
                404,
                ['Cache-Control' => 'no-store']
            );
        }

        return response()->json(
            ['recovery' => $result],
            200,
            ['Cache-Control' => 'no-store, private']
        );
    }

    private function validationError(array $errors): JsonResponse
    {
        return response()->json(['error' => [
            'code' => 'VALIDATION_FAILED',
            'fields' => array_map(fn ($messages) => $messages[0] ?? 'INVALID', $errors),
        ]], 422, ['Cache-Control' => 'no-store']);
    }
}
