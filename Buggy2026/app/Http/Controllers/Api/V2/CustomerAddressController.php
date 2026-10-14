<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use App\Models\CustomerAddress;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use MatanYadaev\EloquentSpatial\Objects\Point;

class CustomerAddressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $addresses = CustomerAddress::where('user_id', $request->user()->id)
            ->orderByDesc('is_default')
            ->orderByDesc('updated_at')
            ->get();

        return response()->json([
            'addresses' => $addresses->map(fn (CustomerAddress $address) => $this->resource($address)),
        ], 200, ['Cache-Control' => 'no-store, private']);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), $this->addressRules());
        if ($validator->fails()) {
            return $this->validationError($validator->errors()->toArray());
        }

        $data = $validator->validated();
        $zone = $this->resolveZone((float) $data['latitude'], (float) $data['longitude']);
        if (!$zone) {
            return $this->error('DELIVERY_AREA_UNAVAILABLE', 422, 'coordinates');
        }

        $address = DB::transaction(function () use ($request, $data, $zone) {
            User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            $hasAddress = CustomerAddress::where('user_id', $request->user()->id)->exists();
            $makeDefault = !$hasAddress || (bool) ($data['is_default'] ?? false);
            if ($makeDefault) {
                CustomerAddress::where('user_id', $request->user()->id)
                    ->where('is_default', true)
                    ->update(['is_default' => false]);
            }

            return CustomerAddress::create($this->attributes(
                $request->user()->id,
                $data,
                $zone->id,
                $makeDefault
            ));
        });

        return response()->json(
            ['address' => $this->resource($address)],
            201,
            ['Cache-Control' => 'no-store, private']
        );
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            ...$this->addressRules(),
            'version' => 'required|date',
        ]);
        if ($validator->fails()) {
            return $this->validationError($validator->errors()->toArray());
        }

        $data = $validator->validated();
        $zone = $this->resolveZone((float) $data['latitude'], (float) $data['longitude']);
        if (!$zone) {
            return $this->error('DELIVERY_AREA_UNAVAILABLE', 422, 'coordinates');
        }

        $result = DB::transaction(function () use ($request, $id, $data, $zone) {
            $address = CustomerAddress::where([
                'id' => $id,
                'user_id' => $request->user()->id,
            ])->lockForUpdate()->first();
            if (!$address) return 'not_found';
            if (!$this->matchesVersion($address, (string) $data['version'])) {
                return 'conflict';
            }

            $makeDefault = (bool) $address->is_default
                || (bool) ($data['is_default'] ?? false);
            if ($makeDefault) {
                CustomerAddress::where('user_id', $request->user()->id)
                    ->whereKeyNot($address->id)
                    ->where('is_default', true)
                    ->update(['is_default' => false]);
            }
            $address->update($this->attributes(
                $request->user()->id,
                $data,
                $zone->id,
                $makeDefault
            ));
            $this->ensureDefault($request->user()->id);

            return $address->fresh();
        });

        if ($result === 'not_found') return $this->error('ADDRESS_NOT_FOUND', 404);
        if ($result === 'conflict') return $this->error('ADDRESS_VERSION_CONFLICT', 409);

        return response()->json(
            ['address' => $this->resource($result)],
            200,
            ['Cache-Control' => 'no-store, private']
        );
    }

    public function makeDefault(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), ['version' => 'required|date']);
        if ($validator->fails()) {
            return $this->validationError($validator->errors()->toArray());
        }

        $result = DB::transaction(function () use ($request, $id) {
            $address = CustomerAddress::where([
                'id' => $id,
                'user_id' => $request->user()->id,
            ])->lockForUpdate()->first();
            if (!$address) return 'not_found';
            if (!$this->matchesVersion($address, (string) $request->input('version'))) {
                return 'conflict';
            }
            if ($address->is_default) return $address;
            CustomerAddress::where('user_id', $request->user()->id)
                ->where('is_default', true)
                ->update(['is_default' => false]);
            $address->update(['is_default' => true]);

            return $address->fresh();
        });

        if ($result === 'not_found') return $this->error('ADDRESS_NOT_FOUND', 404);
        if ($result === 'conflict') return $this->error('ADDRESS_VERSION_CONFLICT', 409);

        return response()->json(
            ['address' => $this->resource($result)],
            200,
            ['Cache-Control' => 'no-store, private']
        );
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), ['version' => 'required|date']);
        if ($validator->fails()) {
            return $this->validationError($validator->errors()->toArray());
        }

        $result = DB::transaction(function () use ($request, $id) {
            $address = CustomerAddress::where([
                'id' => $id,
                'user_id' => $request->user()->id,
            ])->lockForUpdate()->first();
            if (!$address) return 'not_found';
            if (!$this->matchesVersion($address, (string) $request->input('version'))) {
                return 'conflict';
            }
            $address->delete();
            $this->ensureDefault($request->user()->id);

            return 'deleted';
        });

        if ($result === 'not_found') return $this->error('ADDRESS_NOT_FOUND', 404);
        if ($result === 'conflict') return $this->error('ADDRESS_VERSION_CONFLICT', 409);

        return response()->json(['success' => true], 200, ['Cache-Control' => 'no-store']);
    }

    private function addressRules(): array
    {
        return [
            'contact_person_name' => 'required|string|max:100',
            'contact_person_number' => ['required', 'string', 'regex:/^\+?[0-9]{7,15}$/'],
            'address_type' => 'required|string|max:40',
            'address' => 'required|string|max:1000',
            'floor' => 'nullable|string|max:255',
            'road' => 'nullable|string|max:255',
            'landmark' => 'nullable|string|max:255',
            'house' => 'nullable|string|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'is_default' => 'sometimes|boolean',
        ];
    }

    private function attributes(
        int $userId,
        array $data,
        int $zoneId,
        bool $isDefault
    ): array {
        return [
            'user_id' => $userId,
            'contact_person_name' => trim($data['contact_person_name']),
            'contact_person_number' => trim($data['contact_person_number']),
            'address_type' => trim($data['address_type']),
            'address' => trim($data['address']),
            'floor' => $this->nullableTrim($data['floor'] ?? null),
            'road' => $this->nullableTrim($data['road'] ?? null),
            'landmark' => $this->nullableTrim($data['landmark'] ?? null),
            'house' => $this->nullableTrim($data['house'] ?? null),
            'latitude' => (string) ((float) $data['latitude']),
            'longitude' => (string) ((float) $data['longitude']),
            'zone_id' => $zoneId,
            'is_default' => $isDefault,
        ];
    }

    private function resolveZone(float $latitude, float $longitude): ?Zone
    {
        return Zone::where('status', 1)
            ->whereContains('coordinates', new Point($latitude, $longitude, POINT_SRID))
            ->selectRaw('zones.*, ABS(ST_Area(coordinates)) as service_area')
            ->orderBy('service_area')
            ->first();
    }

    private function ensureDefault(int $userId): void
    {
        if (CustomerAddress::where('user_id', $userId)->where('is_default', true)->exists()) {
            return;
        }
        CustomerAddress::where('user_id', $userId)
            ->latest('updated_at')
            ->limit(1)
            ->update(['is_default' => true]);
    }

    private function matchesVersion(CustomerAddress $address, string $version): bool
    {
        return Carbon::parse($version)->equalTo($address->updated_at);
    }

    private function resource(CustomerAddress $address): array
    {
        return [
            'id' => (int) $address->id,
            'address_type' => (string) $address->address_type,
            'contact_person_name' => (string) $address->contact_person_name,
            'contact_person_number' => (string) $address->contact_person_number,
            'address' => (string) $address->address,
            'floor' => $address->floor,
            'road' => $address->road,
            'landmark' => $address->landmark,
            'house' => $address->house,
            'latitude' => (float) $address->latitude,
            'longitude' => (float) $address->longitude,
            'zone_id' => (int) $address->zone_id,
            'is_default' => (bool) $address->is_default,
            'version' => $address->updated_at?->utc()->toIso8601String(),
        ];
    }

    private function nullableTrim(mixed $value): ?string
    {
        $trimmed = trim((string) ($value ?? ''));
        return $trimmed === '' ? null : $trimmed;
    }

    private function validationError(array $fields): JsonResponse
    {
        return response()->json([
            'error' => [
                'code' => 'VALIDATION_FAILED',
                'fields' => array_map(fn (array $messages) => $messages[0] ?? 'INVALID', $fields),
            ],
        ], 422, ['Cache-Control' => 'no-store']);
    }

    private function error(string $code, int $status, ?string $field = null): JsonResponse
    {
        $error = ['code' => $code];
        if ($field) $error['field'] = $field;
        return response()->json(['error' => $error], $status, ['Cache-Control' => 'no-store']);
    }
}
