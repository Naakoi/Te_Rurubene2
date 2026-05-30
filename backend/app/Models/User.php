<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\DB;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'language',
        'dark_mode',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'dark_mode' => 'boolean',
    ];

    public function profile()
    {
        return $this->hasOne(Profile::class);
    }

    public function studio()
    {
        return $this->hasOne(Studio::class);
    }

    public function artist()
    {
        return $this->hasOne(Artist::class);
    }

    public function playlists()
    {
        return $this->hasMany(Playlist::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function wallet()
    {
        return $this->hasOne(Wallet::class);
    }

    public function getIsSubscribedAttribute()
    {
        return $this->subscriptions()
            ->where('expires_at', '>', now())
            ->where('status', 'active')
            ->exists();
    }

    public function hasPurchasedTrack($trackId)
    {
        return DB::table('purchased_tracks')
            ->where('user_id', $this->id)
            ->where('track_id', $trackId)
            ->exists();
    }

    public function hasPurchasedVideo($videoId)
    {
        // For now, using the same logic if we have a purchased_videos table, 
        // or just return false if not implemented yet to avoid crashes.
        return DB::table('purchased_tracks') // Placeholder or check if you have a video purchase table
            ->where('user_id', $this->id)
            ->where('track_id', $videoId) // Assuming shared purchase logic for now or update later
            ->exists();
    }
}
