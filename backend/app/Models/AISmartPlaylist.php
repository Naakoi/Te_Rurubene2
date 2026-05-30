<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AISmartPlaylist extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'name', 'track_ids', 'mood_category', 'generated_at'];

    protected $casts = [
        'track_ids' => 'array',
        'generated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
