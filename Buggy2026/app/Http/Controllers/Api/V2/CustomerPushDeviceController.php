<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use App\Services\CustomerPushDeviceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CustomerPushDeviceController extends Controller
{
    public function store(Request $request, CustomerPushDeviceService $devices): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'installation_id' => ['required', 'regex:/^[a-f0-9]{32}$/'],
            'token' => ['required', 'string', 'max:4096', 'regex:/^[^\s\x00-\x1F\x7F]+$/u'],
            'platform' => ['required', 'in:android,ios'],
            'locale' => ['nullable', 'string', 'max:16', 'regex:/^[a-z]{2}(?:-[A-Z]{2})?$/'],
        ]);
        if ($validator->fails()) {
            return $this->validationError($validator->errors()->toArray());
        }

        $devices->register(
            $request->user(),
            (string) $request->input('installation_id'),
            (string) $request->input('token'),
            (string) $request->input('platform'),
            $request->filled('locale') ? (string) $request->input('locale') : null,
        );

        return response()->json(null, 204, ['Cache-Control' => 'no-store']);
    }

    public function destroy(Request $request, CustomerPushDeviceService $devices): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'installation_id' => ['required', 'regex:/^[a-f0-9]{32}$/'],
        ]);
        if ($validator->fails()) {
            return $this->validationError($validator->errors()->toArray());
        }

        $devices->unregister($request->user(), (string) $request->input('installation_id'));

        return response()->json(null, 204, ['Cache-Control' => 'no-store']);
    }

    private function validationError(array $fields): JsonResponse
    {
        return response()->json(['error' => [
            'code' => 'VALIDATION_FAILED',
            'fields' => array_map(fn ($messages) => $messages[0] ?? 'INVALID', $fields),
        ]], 422, ['Cache-Control' => 'no-store']);
    }
}
