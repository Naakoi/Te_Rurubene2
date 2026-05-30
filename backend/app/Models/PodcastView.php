<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PodcastView extends Model
{
    protected $guarded = [];
    public $timestamps = false;
    
    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function episode()
    {
        return $this->belongsTo(PodcastEpisode::class, 'podcast_episode_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
