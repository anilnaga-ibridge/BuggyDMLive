<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Kreait\Firebase\Factory;
class FirebaseServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton('firebase.firestore', function ($app) {
            $serviceAccountKey = \App\CentralLogics\Helpers::get_business_settings('push_notification_service_file_content') ?? [];
            if (is_string($serviceAccountKey)) {
                $serviceAccountKey = json_decode($serviceAccountKey, true) ?? [];
            }
            if (is_array($serviceAccountKey) && count($serviceAccountKey) > 0) {
                try {
                    return (new Factory)
                        ->withServiceAccount($serviceAccountKey)
                        ->createMessaging();
                } catch (\Throwable $e) {
                    return false;
                }
            }
            return false;
        });

        $this->app->singleton('firebase.messaging', function ($app) {
            $serviceAccountKey = \App\CentralLogics\Helpers::get_business_settings('push_notification_service_file_content') ?? [];
            if (is_string($serviceAccountKey)) {
                $serviceAccountKey = json_decode($serviceAccountKey, true) ?? [];
            }
            if (is_array($serviceAccountKey) && count($serviceAccountKey) > 0) {
                try {
                    return (new Factory)
                        ->withServiceAccount($serviceAccountKey)
                        ->createMessaging();
                } catch (\Throwable $e) {
                    return false;
                }
            }
            return false;
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
