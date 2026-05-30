<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Podcast extends Model
{
    use HasFactory;
    protected $guarded = [];

    protected $casts = [
        'is_premium' => 'boolean',
        'price' => 'decimal:2',
    ];

    public function studio()
    {
        return $this->belongsTo(Studio::class);
    }

    public function category()
    {
        return $this->belongsTo(PodcastCategory::class, 'category_id');
    }

    public function series()
    {
        return $this->hasMany(PodcastSeries::class);
    }

    public function episodes()
    {
        return $this->hasMany(PodcastEpisode::class);
    }
}
