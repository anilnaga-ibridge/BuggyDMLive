<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_order_submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('user_id');
            $table->uuid('quote_id');
            $table->char('idempotency_key_hash', 64);
            $table->char('request_hash', 64);
            $table->unsignedBigInteger('order_id')->nullable();
            $table->string('state', 24)->default('processing');
            $table->unsignedSmallInteger('response_status')->nullable();
            $table->json('response_body')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'idempotency_key_hash'], 'customer_order_submission_user_key_unique');
            $table->unique('quote_id', 'customer_order_submission_quote_unique');
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_order_submissions');
    }
};
