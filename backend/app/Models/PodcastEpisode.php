<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PodcastEpisode extends Model
{
    use HasFactory;
    protected $guarded = [];

    protected $casts = [
        'is_premium' => 'boolean',
        'price' => 'decimal:2',
        'guest_speakers' => 'array',
        'published_at' => 'datetime',
    ];

    public function podcast()
    {
        return $this->belongsTo(Podcast::class);
    }

    public function series()
    {
        return $this->belongsTo(PodcastSeries::class, 'podcast_series_id');
    }

    public function views()
    {
        return $this->hasMany(PodcastView::class);
    }
}
