<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tracks', function (Blueprint $table) {
            $table->decimal('price', 8, 2)->default(0.00)->after('is_premium');
        });

        Schema::table('videos', function (Blueprint $table) {
            $table->decimal('price', 8, 2)->default(0.00)->after('is_premium');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tracks', function (Blueprint $table) {
            $table->dropColumn('price');
        });

        Schema::table('videos', function (Blueprint $table) {
            $table->dropColumn('price');
        });
    }
};
