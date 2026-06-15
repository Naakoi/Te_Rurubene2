<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transfer extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function senderTransaction()
    {
        return $this->belongsTo(Transaction::class, 'sender_transaction_id');
    }

    public function receiverTransaction()
    {
        return $this->belongsTo(Transaction::class, 'receiver_transaction_id');
    }
}
