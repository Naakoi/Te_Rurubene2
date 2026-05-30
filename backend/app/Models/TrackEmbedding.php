<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrackEmbedding extends Model
{
    use HasFactory;

    protected $fillable = ['track_id', 'vector_embedding', 'model_version'];

    protected $casts = [
        'vector_embedding' => 'array',
    ];

    public function track()
    {
        return $this->belongsTo(Track::class);
    }
}
