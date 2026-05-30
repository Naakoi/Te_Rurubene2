<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('track_embeddings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('track_id')->constrained()->cascadeOnDelete();
            $table->json('vector_embedding'); // Storing as JSON for now, could be pgvector
            $table->string('model_version');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('track_embeddings');
    }
};
