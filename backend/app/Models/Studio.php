<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Studio extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function artists()
    {
        return $this->hasMany(Artist::class);
    }

    public function podcasts()
    {
        return $this->hasMany(Podcast::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function videos()
    {
        return $this->hasMany(Video::class);
    }
}
