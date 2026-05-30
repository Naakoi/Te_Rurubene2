<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchased_contents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('purchase_id')->constrained()->cascadeOnDelete();
            $table->string('content_type'); // song, album, podcast, ticket, merchandise, subscription, tip
            $table->unsignedBigInteger('content_id');
            $table->decimal('price', 10, 2);
            $table->timestamps();

            // Add index for fast checks
            $table->index(['user_id', 'content_type', 'content_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchased_contents');
    }
};
