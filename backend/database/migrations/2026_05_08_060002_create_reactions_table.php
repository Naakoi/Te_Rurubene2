<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->morphs('reactionable'); // reactionable_id, reactionable_type
            $table->string('type'); // 'like', 'fire', 'heart', etc.
            $table->timestamps();
            
            // A user can only react once to a specific item with a specific type
            $table->unique(['user_id', 'reactionable_id', 'reactionable_type', 'type'], 'user_reaction_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reactions');
    }
};
