<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchasedTrack extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'track_id',
        'price',
    ];

    /**
     * Get the track that was purchased.
     */
    public function track()
    {
        return $this->belongsTo(Track::class);
    }
}
