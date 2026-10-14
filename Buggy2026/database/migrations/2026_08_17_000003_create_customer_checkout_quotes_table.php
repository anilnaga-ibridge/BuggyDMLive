<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_checkout_quotes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('user_id')->index();
            $table->unsignedBigInteger('address_id');
            $table->unsignedBigInteger('store_id');
            $table->unsignedBigInteger('module_id');
            $table->unsignedBigInteger('zone_id');
            $table->char('idempotency_key_hash', 64);
            $table->char('request_hash', 64);
            $table->char('cart_fingerprint', 64);
            $table->char('currency', 3);
            $table->unsignedBigInteger('subtotal_minor');
            $table->unsignedBigInteger('discount_minor')->default(0);
            $table->unsignedBigInteger('tax_minor')->default(0);
            $table->unsignedBigInteger('delivery_minor')->default(0);
            $table->unsignedBigInteger('total_minor');
            $table->json('snapshot');
            $table->timestamp('expires_at')->index();
            $table->timestamp('consumed_at')->nullable()->index();
            $table->timestamps();

            $table->unique(
                ['user_id', 'idempotency_key_hash'],
                'customer_quote_idempotency_unique'
            );
            $table->index(
                ['user_id', 'expires_at', 'consumed_at'],
                'customer_quote_active_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_checkout_quotes');
    }
};
