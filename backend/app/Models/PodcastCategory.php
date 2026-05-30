<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PodcastCategory extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function podcasts()
    {
        return $this->hasMany(Podcast::class, 'category_id');
    }
}
