<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'is_tip' => 'boolean',
    ];

    public function liveEvent()
    {
        return $this->belongsTo(LiveEvent::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
