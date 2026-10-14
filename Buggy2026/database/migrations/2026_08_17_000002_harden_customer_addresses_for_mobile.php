<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->boolean('is_default')->default(false)->after('zone_id');
            $table->index(['user_id', 'is_default'], 'customer_address_default_idx');
            $table->index(['user_id', 'updated_at'], 'customer_address_recent_idx');
        });

        DB::statement(<<<'SQL'
            UPDATE customer_addresses AS address
            INNER JOIN (
                SELECT user_id, MAX(id) AS default_id
                FROM customer_addresses
                WHERE user_id IS NOT NULL
                GROUP BY user_id
            ) AS selected
                ON selected.default_id = address.id
            SET address.is_default = 1
        SQL);
    }

    public function down(): void
    {
        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->dropIndex('customer_address_default_idx');
            $table->dropIndex('customer_address_recent_idx');
            $table->dropColumn('is_default');
        });
    }
};
