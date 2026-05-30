<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PodcastSeries extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function podcast()
    {
        return $this->belongsTo(Podcast::class);
    }

    public function episodes()
    {
        return $this->hasMany(PodcastEpisode::class);
    }
}
