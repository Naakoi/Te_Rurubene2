<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchasedContent extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    /**
     * Polymorphic relation / helper to retrieve the actual purchased content.
     */
    public function content()
    {
        switch ($this->content_type) {
            case 'song':
            case 'track':
                return $this->belongsTo(Track::class, 'content_id');
            case 'album':
                return $this->belongsTo(Album::class, 'content_id');
            case 'podcast':
                return $this->belongsTo(Podcast::class, 'content_id');
            case 'ticket':
                return $this->belongsTo(Ticket::class, 'content_id');
            case 'product':
            case 'merchandise':
                return $this->belongsTo(Product::class, 'content_id');
            default:
                return null;
        }
    }
}
