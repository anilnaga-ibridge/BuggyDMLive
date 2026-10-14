<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_mobile_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('user_id')->index();
            $table->unsignedBigInteger('tenant_id')->default(0)->index();
            $table->unsignedBigInteger('sub_tenant_id')->default(0)->index();
            $table->char('installation_id_hash', 64);
            $table->char('refresh_token_hash', 64)->unique();
            $table->string('access_token_id', 100)->nullable()->index();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->index();
            $table->timestamp('revoked_at')->nullable()->index();
            $table->timestamps();

            $table->index(
                ['user_id', 'installation_id_hash', 'revoked_at'],
                'customer_mobile_session_actor_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_mobile_sessions');
    }
};
