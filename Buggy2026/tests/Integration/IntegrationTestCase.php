<?php

namespace Tests\Integration;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

abstract class IntegrationTestCase extends TestCase
{
    private bool $transactionStarted = false;

    protected function setUp(): void
    {
        parent::setUp();

        if (env('RUN_MOBILE_INTEGRATION') !== '1') {
            $this->markTestSkipped('Set RUN_MOBILE_INTEGRATION=1 to run isolated mobile integration tests.');
        }

        $connection = config('database.default');
        $database = (string) config("database.connections.{$connection}.database");
        $url = config("database.connections.{$connection}.url");
        $host = (string) config("database.connections.{$connection}.host");

        if (
            app()->environment() !== 'testing'
            || $connection !== 'mysql'
            || ! in_array($host, ['127.0.0.1', 'localhost', '::1'], true)
            || ! str_contains(strtolower($database), 'integration')
            || ! empty($url)
        ) {
            $this->fail('Refusing to run mobile integration tests outside an isolated local MySQL database.');
        }

        $resolvedDatabase = DB::connection()->getDatabaseName();
        if ($resolvedDatabase !== $database) {
            $this->fail("Resolved database [{$resolvedDatabase}] does not match guarded target [{$database}].");
        }

        DB::beginTransaction();
        $this->transactionStarted = true;
        Carbon::setTestNow(Carbon::parse('2026-08-17 12:00:00', config('app.timezone')));
        config()->set('currency', null);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        if ($this->transactionStarted && DB::transactionLevel() > 0) {
            DB::rollBack();
        }

        parent::tearDown();
    }
}
