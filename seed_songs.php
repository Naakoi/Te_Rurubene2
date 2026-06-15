<?php

// Seed script for Rurubene2 tracks and albums
// Run with: php seed_songs.php

require '/var/www/rurubene2/backend/vendor/autoload.php';
$app = require '/var/www/rurubene2/backend/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Artist;
use App\Models\Album;
use App\Models\Track;

echo "=== Rurubene2 Song/Track Seeder ===\n";

// Get artists
$hine = Artist::where('name', 'Hine Moana')->first();
$toa = Artist::where('name', 'Toa Samoa')->first();
$mere = Artist::where('name', 'Mere Teiti')->first();

if (!$hine || !$toa || !$mere) {
    echo "Error: One or more artists not found in the database. Run seed_data.php first!\n";
    exit(1);
}

// ----------------------------------------------------------------
// 1. Hine Moana (ID: {$hine->id})
// ----------------------------------------------------------------
echo "\nCreating Album and Tracks for Hine Moana...\n";
$hineAlbum = Album::firstOrCreate(
    ['title' => 'Moana Soul', 'artist_id' => $hine->id],
    [
        'release_date' => '2026-06-01',
        'cover_image' => 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500'
    ]
);

$hineTracks = [
    [
        'title' => 'Te Kuki Airani',
        'audio_file_path' => 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        'cover_url' => 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
        'duration' => 372,
        'is_premium' => false,
        'price' => 0.00,
        'status' => 'ready'
    ],
    [
        'title' => 'Polynesian Breeze',
        'audio_file_path' => 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        'cover_url' => 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
        'duration' => 423,
        'is_premium' => false,
        'price' => 0.00,
        'status' => 'ready'
    ],
    [
        'title' => 'Rarotonga Sunset',
        'audio_file_path' => 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        'cover_url' => 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
        'duration' => 302,
        'is_premium' => true,
        'price' => 1.99,
        'status' => 'ready'
    ]
];

foreach ($hineTracks as $t) {
    Track::firstOrCreate(
        ['title' => $t['title'], 'artist_id' => $hine->id],
        array_merge($t, ['album_id' => $hineAlbum->id])
    );
    echo "  + Track: {$t['title']}\n";
}

// ----------------------------------------------------------------
// 2. Toa Samoa (ID: {$toa->id})
// ----------------------------------------------------------------
echo "\nCreating Album and Tracks for Toa Samoa...\n";
$toaAlbum = Album::firstOrCreate(
    ['title' => 'Alofa & Power', 'artist_id' => $toa->id],
    [
        'release_date' => '2026-06-02',
        'cover_image' => 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500'
    ]
);

$toaTracks = [
    [
        'title' => 'Street Warrior',
        'audio_file_path' => 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        'cover_url' => 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500',
        'duration' => 302,
        'is_premium' => false,
        'price' => 0.00,
        'status' => 'ready'
    ],
    [
        'title' => 'Apia Nights',
        'audio_file_path' => 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
        'cover_url' => 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500',
        'duration' => 312,
        'is_premium' => false,
        'price' => 0.00,
        'status' => 'ready'
    ],
    [
        'title' => 'Mana of the Land',
        'audio_file_path' => 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
        'cover_url' => 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500',
        'duration' => 345,
        'is_premium' => true,
        'price' => 2.50,
        'status' => 'ready'
    ]
];

foreach ($toaTracks as $t) {
    Track::firstOrCreate(
        ['title' => $t['title'], 'artist_id' => $toa->id],
        array_merge($t, ['album_id' => $toaAlbum->id])
    );
    echo "  + Track: {$t['title']}\n";
}

// ----------------------------------------------------------------
// 3. Mere Teiti (ID: {$mere->id})
// ----------------------------------------------------------------
echo "\nCreating Album and Tracks for Mere Teiti...\n";
$mereAlbum = Album::firstOrCreate(
    ['title' => 'Waiata Jazz', 'artist_id' => $mere->id],
    [
        'release_date' => '2026-06-03',
        'cover_image' => 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500'
    ]
);

$mereTracks = [
    [
        'title' => 'E Ipo (Soul Version)',
        'audio_file_path' => 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
        'cover_url' => 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500',
        'duration' => 328,
        'is_premium' => false,
        'price' => 0.00,
        'status' => 'ready'
    ],
    [
        'title' => 'Koru Whispers',
        'audio_file_path' => 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
        'cover_url' => 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500',
        'duration' => 298,
        'is_premium' => false,
        'price' => 0.00,
        'status' => 'ready'
    ],
    [
        'title' => 'Rotorua Rain',
        'audio_file_path' => 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
        'cover_url' => 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500',
        'duration' => 356,
        'is_premium' => true,
        'price' => 1.50,
        'status' => 'ready'
    ]
];

foreach ($mereTracks as $t) {
    Track::firstOrCreate(
        ['title' => $t['title'], 'artist_id' => $mere->id],
        array_merge($t, ['album_id' => $mereAlbum->id])
    );
    echo "  + Track: {$t['title']}\n";
}

echo "\n[Summary] Total Tracks in DB: " . Track::count() . "\n";
echo "=== Song Seeding Complete! ===\n";
