<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UploadSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'upload_id',
        'file_name',
        'media_type',
        'status',
        'is_premium',
        'price',
        'parts',
    ];

    protected $casts = [
        'parts' => 'array',
        'is_premium' => 'boolean',
        'price' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
