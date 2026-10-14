<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_push_devices', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id')->index();
            $table->unsignedBigInteger('tenant_id')->default(0)->index();
            $table->unsignedBigInteger('sub_tenant_id')->default(0)->index();
            $table->char('installation_id_hash', 64);
            $table->char('token_hash', 64)->unique();
            $table->text('token_ciphertext');
            $table->string('platform', 10);
            $table->string('locale', 16)->nullable();
            $table->timestamp('last_seen_at')->nullable()->index();
            $table->timestamp('disabled_at')->nullable()->index();
            $table->timestamps();

            $table->unique(
                ['user_id', 'installation_id_hash'],
                'customer_push_device_actor_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_push_devices');
    }
};
