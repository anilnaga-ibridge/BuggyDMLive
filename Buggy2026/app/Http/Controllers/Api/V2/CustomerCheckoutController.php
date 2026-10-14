<?php

namespace App\Http\Controllers\Api\V2;

use App\Exceptions\CheckoutQuoteException;
use App\Http\Controllers\Controller;
use App\Services\CustomerCheckoutQuoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CustomerCheckoutController extends Controller
{
    public function quote(Request $request, CustomerCheckoutQuoteService $quotes): JsonResponse
    {
        $validator = Validator::make([
            ...$request->all(),
            'idempotency_key' => $request->header('Idempotency-Key'),
        ], [
            'address_id' => 'required|integer|min:1',
            'store_id' => 'required|integer|min:1',
            'module_id' => 'required|integer|min:1',
            'idempotency_key' => ['required', 'string', 'min:16', 'max:100', 'regex:/^[A-Za-z0-9._:-]+$/'],
        ]);
        if ($validator->fails()) {
            return response()->json([
                'error' => [
                    'code' => 'VALIDATION_FAILED',
                    'fields' => array_map(
                        fn (array $messages) => $messages[0] ?? 'INVALID',
                        $validator->errors()->toArray()
                    ),
                ],
            ], 422, ['Cache-Control' => 'no-store']);
        }

        try {
            $quote = $quotes->create(
                $request->user(),
                (int) $request->input('address_id'),
                (int) $request->input('store_id'),
                (int) $request->input('module_id'),
                (string) $request->header('Idempotency-Key'),
            );
        } catch (CheckoutQuoteException $error) {
            $body = ['code' => $error->getMessage()];
            if ($error->field) $body['field'] = $error->field;
            return response()->json(
                ['error' => $body],
                $error->status,
                ['Cache-Control' => 'no-store']
            );
        }

        return response()->json(
            ['quote' => $quotes->resource($quote)],
            200,
            ['Cache-Control' => 'no-store, private']
        );
    }
}
