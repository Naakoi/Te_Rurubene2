<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g. 'Pro', 'Premium'
            $table->string('type')->default('listener'); // 'artist', 'studio', 'listener'
            $table->decimal('price', 8, 2); // Price in AUD
            $table->string('interval'); // 'monthly', 'yearly'
            $table->json('features')->nullable(); // List of features
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
