<?php

use Illuminate\Support\Facades\Route;

Route::group(['namespace' => 'Api\V2'], function () {
    Route::post('ls-lib-update', 'LsLibController@lib_update');

    Route::prefix('customer/auth')->group(function () {
        Route::post('guest', 'CustomerMobileAuthController@guest')
            ->middleware('throttle:20,1');
        Route::post('register', 'CustomerMobileAuthController@register')
            ->middleware('throttle:10,1');
        Route::post('login', 'CustomerMobileAuthController@login')
            ->middleware('throttle:5,1');
        Route::post('refresh', 'CustomerMobileAuthController@refresh')
            ->middleware('throttle:30,1');
        Route::post('logout', 'CustomerMobileAuthController@logout')
            ->middleware(['auth:api', 'throttle:30,1']);
    });

    Route::prefix('customer')->middleware(['auth:api', 'throttle:60,1'])->group(function () {
        Route::prefix('locations')->group(function () {
            Route::get('search', 'CustomerLocationController@search')
                ->middleware('throttle:30,1');
            Route::get('places/{placeId}', 'CustomerLocationController@details')
                ->where('placeId', '[A-Za-z0-9_-]+');
            Route::get('reverse-geocode', 'CustomerLocationController@reverseGeocode');
            Route::get('serviceability', 'CustomerLocationController@serviceability');
        });
        Route::prefix('addresses')->group(function () {
            Route::get('/', 'CustomerAddressController@index');
            Route::post('/', 'CustomerAddressController@store');
            Route::put('{id}', 'CustomerAddressController@update')->whereNumber('id');
            Route::patch('{id}/default', 'CustomerAddressController@makeDefault')->whereNumber('id');
            Route::delete('{id}', 'CustomerAddressController@destroy')->whereNumber('id');
        });
        Route::post('checkout/quote', 'CustomerCheckoutController@quote')
            ->middleware('throttle:20,1');
        Route::post('orders', 'CustomerOrderController@store')
            ->middleware('throttle:10,1');
        Route::get('orders/recovery', 'CustomerOrderController@recover')
            ->middleware('throttle:30,1');
        Route::get('orders', 'CustomerOrderController@index');
        Route::get('orders/{id}/tracking', 'CustomerOrderController@tracking')->whereNumber('id');
        Route::get('orders/{id}', 'CustomerOrderController@show')->whereNumber('id');
        Route::post('push-devices', 'CustomerPushDeviceController@store')
            ->middleware('throttle:20,1');
        Route::delete('push-devices/current', 'CustomerPushDeviceController@destroy')
            ->middleware('throttle:20,1');
    });
});
