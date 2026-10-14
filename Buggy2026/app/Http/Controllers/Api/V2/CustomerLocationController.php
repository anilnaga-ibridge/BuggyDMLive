<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use App\Models\BusinessSetting;
use App\Models\Zone;
use Illuminate\Http\Client\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use MatanYadaev\EloquentSpatial\Objects\Point;
use Throwable;

class CustomerLocationController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:2|max:120',
            'session_token' => 'required|string|min:16|max:64|regex:/^[A-Za-z0-9_-]+$/',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);
        if ($validator->fails()) return $this->validationError($validator->errors()->toArray());
        if ($request->has('latitude') xor $request->has('longitude')) {
            return $this->validationError(['coordinates' => ['Latitude and longitude must be provided together.']]);
        }

        $data = $validator->validated();
        $payload = [
            'input' => trim($data['query']),
            'languageCode' => $this->language($request),
            'includedRegionCodes' => ['in'],
            'includeQueryPredictions' => false,
            'sessionToken' => $data['session_token'],
        ];
        if (isset($data['latitude'], $data['longitude'])) {
            $payload['locationBias'] = [
                'circle' => [
                    'center' => [
                        'latitude' => (float) $data['latitude'],
                        'longitude' => (float) $data['longitude'],
                    ],
                    'radius' => 50000.0,
                ],
            ];
        }

        $response = $this->placesRequest(
            'https://places.googleapis.com/v1/places:autocomplete',
            'POST',
            $payload,
            'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat'
        );
        if ($response instanceof JsonResponse) return $response;

        $suggestions = collect($response->json('suggestions', []))
            ->map(fn ($suggestion) => is_array($suggestion) ? ($suggestion['placePrediction'] ?? null) : null)
            ->filter(fn ($prediction) => is_array($prediction) && !empty($prediction['placeId']))
            ->map(function (array $prediction) {
                $structured = $prediction['structuredFormat'] ?? [];
                return [
                    'place_id' => (string) $prediction['placeId'],
                    'primary_text' => (string) data_get($structured, 'mainText.text', data_get($prediction, 'text.text', '')),
                    'secondary_text' => (string) data_get($structured, 'secondaryText.text', ''),
                    'full_text' => (string) data_get($prediction, 'text.text', ''),
                ];
            })
            ->values();

        return response()->json(['suggestions' => $suggestions], 200, $this->privateHeaders());
    }

    public function details(Request $request, string $placeId): JsonResponse
    {
        $validator = Validator::make([
            ...$request->all(),
            'place_id' => $placeId,
        ], [
            'place_id' => 'required|string|max:255|regex:/^[A-Za-z0-9_-]+$/',
            'session_token' => 'required|string|min:16|max:64|regex:/^[A-Za-z0-9_-]+$/',
        ]);
        if ($validator->fails()) return $this->validationError($validator->errors()->toArray());

        $query = http_build_query([
            'languageCode' => $this->language($request),
            'sessionToken' => $validator->validated()['session_token'],
        ]);
        $response = $this->placesRequest(
            'https://places.googleapis.com/v1/places/' . rawurlencode($placeId) . '?' . $query,
            'GET',
            [],
            'id,displayName,formattedAddress,location'
        );
        if ($response instanceof JsonResponse) return $response;

        $location = $response->json('location');
        if (!is_array($location) || !isset($location['latitude'], $location['longitude'])) {
            return $this->providerError();
        }

        return response()->json(['place' => [
            'place_id' => (string) $response->json('id', $placeId),
            'name' => (string) $response->json('displayName.text', ''),
            'formatted_address' => (string) $response->json('formattedAddress', ''),
            'latitude' => (float) $location['latitude'],
            'longitude' => (float) $location['longitude'],
        ]], 200, $this->privateHeaders());
    }

    public function reverseGeocode(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);
        if ($validator->fails()) return $this->validationError($validator->errors()->toArray());
        $key = $this->apiKey();
        if ($key === null) return $this->unavailable();

        try {
            $response = Http::acceptJson()->timeout(5)->retry(2, 100)->get(
                'https://maps.googleapis.com/maps/api/geocode/json',
                [
                    'latlng' => $validator->validated()['latitude'] . ',' . $validator->validated()['longitude'],
                    'language' => $this->language($request),
                    'region' => 'in',
                    'key' => $key,
                ]
            );
        } catch (Throwable) {
            return $this->providerError();
        }
        if (!$response->successful() || $response->json('status') !== 'OK') {
            return $this->providerError();
        }
        $result = $response->json('results.0');
        if (!is_array($result) || empty($result['formatted_address'])) return $this->providerError();

        return response()->json(['location' => [
            'formatted_address' => (string) $result['formatted_address'],
            'latitude' => (float) $validator->validated()['latitude'],
            'longitude' => (float) $validator->validated()['longitude'],
        ]], 200, $this->privateHeaders());
    }

    public function serviceability(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'module_id' => 'required|integer|min:1',
        ]);
        if ($validator->fails()) return $this->validationError($validator->errors()->toArray());
        $data = $validator->validated();
        $moduleId = (int) $data['module_id'];
        $zone = Zone::where('status', 1)
            ->whereContains('coordinates', new Point((float) $data['latitude'], (float) $data['longitude'], POINT_SRID))
            ->whereHas('modules', fn ($query) => $query->where('modules.id', $moduleId))
            ->selectRaw('zones.*, ABS(ST_Area(coordinates)) as service_area')
            ->orderBy('service_area')
            ->first();

        return response()->json([
            'serviceability' => [
                'available' => $zone !== null,
                'module_id' => $moduleId,
                'zone_id' => $zone ? (int) $zone->id : null,
                'zone_name' => $zone ? (string) ($zone->display_name ?: $zone->name) : null,
            ],
        ], 200, $this->privateHeaders());
    }

    private function placesRequest(string $url, string $method, array $payload, string $fieldMask): Response|JsonResponse
    {
        $key = $this->apiKey();
        if ($key === null) return $this->unavailable();
        try {
            $pending = Http::acceptJson()->asJson()->timeout(5)->retry(2, 100)->withHeaders([
                'X-Goog-Api-Key' => $key,
                'X-Goog-FieldMask' => $fieldMask,
            ]);
            $response = $method === 'POST' ? $pending->post($url, $payload) : $pending->get($url);
        } catch (Throwable) {
            return $this->providerError();
        }
        return $response->successful() ? $response : $this->providerError();
    }

    private function apiKey(): ?string
    {
        $key = trim((string) BusinessSetting::where('key', 'map_api_key_server')->value('value'));
        return $key === '' ? null : $key;
    }

    private function language(Request $request): string
    {
        $language = strtolower(substr((string) $request->header('X-localization', 'en'), 0, 2));
        return in_array($language, ['en', 'te', 'hi'], true) ? $language : 'en';
    }

    private function privateHeaders(): array
    {
        return ['Cache-Control' => 'no-store, private'];
    }

    private function validationError(array $fields): JsonResponse
    {
        return response()->json(['error' => [
            'code' => 'VALIDATION_FAILED',
            'fields' => array_map(fn (array $messages) => $messages[0] ?? 'INVALID', $fields),
        ]], 422, $this->privateHeaders());
    }

    private function unavailable(): JsonResponse
    {
        return response()->json(['error' => ['code' => 'MAPS_PROVIDER_UNAVAILABLE']], 503, $this->privateHeaders());
    }

    private function providerError(): JsonResponse
    {
        return response()->json(['error' => ['code' => 'MAPS_PROVIDER_FAILED']], 502, $this->privateHeaders());
    }
}
