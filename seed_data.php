<?php

// Seed script for Rurubene2 production database
// Run with: php seed_data.php (from project root, or paste into php -r)

require '/var/www/rurubene2/backend/vendor/autoload.php';
$app = require '/var/www/rurubene2/backend/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Profile;
use App\Models\Studio;
use App\Models\Artist;
use App\Models\Product;
use App\Models\Wallet;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

echo "=== Rurubene2 Data Seeder ===\n";

// ----------------------------------------------------------------
// 1. STUDIO USER + STUDIO
// ----------------------------------------------------------------
echo "\n[1/4] Creating Studio...\n";

$studioUser = User::firstOrCreate(
    ['email' => 'pacificwave@studio.com'],
    [
        'name'     => 'Pacific Wave Studio',
        'password' => 'StudioPass123',
        'role'     => 'studio',
    ]
);
Profile::firstOrCreate(['user_id' => $studioUser->id], [
    'bio'    => 'The premier Pacific music production house, home to iconic Polynesian artists.',
    'avatar' => null,
]);
Wallet::firstOrCreate(['user_id' => $studioUser->id], ['balance' => 500.00, 'currency' => 'NZD']);

$studio = Studio::firstOrCreate(
    ['user_id' => $studioUser->id],
    [
        'name'                => 'Pacific Wave Studio',
        'bio'                 => 'Pacific Wave Studio is dedicated to amplifying Pacific voices through music, culture, and art.',
        'verification_status' => 'approved',
    ]
);
echo "  Studio created: {$studio->name} (ID {$studio->id})\n";

// ----------------------------------------------------------------
// 2. ARTIST USERS + ARTISTS (with Merchandise products)
// ----------------------------------------------------------------
echo "\n[2/4] Creating Artists with Merchandise...\n";

$artistsData = [
    [
        'user'  => [
            'name'     => 'Hine Moana',
            'email'    => 'hine@artist.com',
            'password' => 'ArtistPass123',
            'role'     => 'artist',
        ],
        'profile' => [
            'bio'    => 'Hine Moana blends traditional Cook Islands melodies with contemporary R&B.',
            'avatar' => null,
        ],
        'artist' => [
            'name'                => 'Hine Moana',
            'bio'                 => 'Award-winning Cook Islands singer-songwriter bringing Polynesian soul to the world stage.',
            'verification_status' => 'approved',
        ],
        'merch' => [
            [
                'name'           => 'Hine Moana – Stitched Tapa Tote Bag',
                'category'       => 'Merchandise',
                'description'    => 'Handcrafted tote bag featuring traditional tapa cloth patterns. Perfect for beach days or farmers markets.',
                'price'          => 45.00,
                'stock_quantity' => 30,
                'image_url'      => null,
            ],
            [
                'name'           => 'Hine Moana – "Moana Soul" Album Tee',
                'category'       => 'Merchandise',
                'description'    => 'Official tour t-shirt for the Moana Soul album. 100% organic cotton, screen-printed with Pacific-inspired artwork.',
                'price'          => 55.00,
                'stock_quantity' => 50,
                'image_url'      => null,
            ],
            [
                'name'           => 'Hine Moana – Signed Vinyl LP',
                'category'       => 'Merchandise',
                'description'    => 'Hand-signed limited edition vinyl record. A collector\'s item from the debut album.',
                'price'          => 85.00,
                'stock_quantity' => 10,
                'image_url'      => null,
            ],
        ],
    ],
    [
        'user'  => [
            'name'     => 'Toa Samoa',
            'email'    => 'toa@artist.com',
            'password' => 'ArtistPass123',
            'role'     => 'artist',
        ],
        'profile' => [
            'bio'    => 'Toa Samoa brings raw Pacific hip-hop to the streets of Auckland and beyond.',
            'avatar' => null,
        ],
        'artist' => [
            'name'                => 'Toa Samoa',
            'bio'                 => 'Pacific hip-hop artist representing Samoa with powerful lyricism and cultural pride.',
            'verification_status' => 'approved',
        ],
        'merch' => [
            [
                'name'           => 'Toa Samoa – Warrior Cap',
                'category'       => 'Merchandise',
                'description'    => 'Embroidered snapback cap with the Toa Samoa logo. One size fits most.',
                'price'          => 40.00,
                'stock_quantity' => 40,
                'image_url'      => null,
            ],
            [
                'name'           => 'Toa Samoa – "Alofa" Hoodie',
                'category'       => 'Merchandise',
                'description'    => 'Premium heavyweight hoodie with "ALOFA" printed across the chest. Available in black and navy.',
                'price'          => 95.00,
                'stock_quantity' => 25,
                'image_url'      => null,
            ],
            [
                'name'           => 'Toa Samoa – Dog Tag Necklace',
                'category'       => 'Merchandise',
                'description'    => 'Stainless steel dog tag necklace engraved with a traditional Samoan pattern.',
                'price'          => 30.00,
                'stock_quantity' => 60,
                'image_url'      => null,
            ],
        ],
    ],
    [
        'user'  => [
            'name'     => 'Mere Teiti',
            'email'    => 'mere@artist.com',
            'password' => 'ArtistPass123',
            'role'     => 'artist',
        ],
        'profile' => [
            'bio'    => 'Mere Teiti is a Māori jazz vocalist from Rotorua, weaving te reo into every performance.',
            'avatar' => null,
        ],
        'artist' => [
            'name'                => 'Mere Teiti',
            'bio'                 => 'Māori jazz and soul singer celebrated for her stunning voice and cultural storytelling.',
            'verification_status' => 'approved',
        ],
        'merch' => [
            [
                'name'           => 'Mere Teiti – Koru Print Scarf',
                'category'       => 'Merchandise',
                'description'    => 'Soft bamboo-blend scarf featuring a koru spiral print. Lightweight and versatile.',
                'price'          => 38.00,
                'stock_quantity' => 35,
                'image_url'      => null,
            ],
            [
                'name'           => 'Mere Teiti – "Waiata" Sheet Music Book',
                'category'       => 'Merchandise',
                'description'    => 'Professionally printed sheet music collection with 12 original waiata compositions.',
                'price'          => 28.00,
                'stock_quantity' => 20,
                'image_url'      => null,
            ],
        ],
    ],
];

foreach ($artistsData as $data) {
    $user = User::firstOrCreate(
        ['email' => $data['user']['email']],
        $data['user']
    );
    Profile::firstOrCreate(['user_id' => $user->id], $data['profile']);
    Wallet::firstOrCreate(['user_id' => $user->id], ['balance' => 0.00, 'currency' => 'NZD']);

    $artist = Artist::firstOrCreate(
        ['user_id' => $user->id],
        array_merge($data['artist'], ['studio_id' => $studio->id])
    );
    echo "  Artist: {$artist->name} (ID {$artist->id})\n";

    foreach ($data['merch'] as $item) {
        $existing = Product::where('name', $item['name'])->where('artist_id', $artist->id)->first();
        if (!$existing) {
            Product::create(array_merge($item, [
                'artist_id' => $artist->id,
                'studio_id' => $studio->id,
            ]));
            echo "    + Product: {$item['name']}\n";
        } else {
            echo "    ~ Product already exists: {$item['name']}\n";
        }
    }
}

// ----------------------------------------------------------------
// 3. LISTENER USERS
// ----------------------------------------------------------------
echo "\n[3/4] Creating Listener accounts...\n";

$listeners = [
    ['name' => 'Aroha Williams',   'email' => 'aroha@listener.com',   'bio' => 'Pacific music lover from Wellington.'],
    ['name' => 'Sione Faleolo',    'email' => 'sione@listener.com',   'bio' => 'Samoan beats and R&B fan from Auckland.'],
    ['name' => 'Kezia Rangi',      'email' => 'kezia@listener.com',   'bio' => 'Jazz and soul enthusiast from Christchurch.'],
    ['name' => 'Tupou Fifita',     'email' => 'tupou@listener.com',   'bio' => 'Tongan music advocate and community organiser.'],
    ['name' => 'Maia Ngata',       'email' => 'maia@listener.com',    'bio' => 'Indie and Maori fusion fan from Hamilton.'],
];

foreach ($listeners as $l) {
    $user = User::firstOrCreate(
        ['email' => $l['email']],
        [
            'name'     => $l['name'],
            'password' => 'ListenerPass123',
            'role'     => 'client',
        ]
    );
    Profile::firstOrCreate(['user_id' => $user->id], [
        'bio'    => $l['bio'],
        'avatar' => null,
    ]);
    Wallet::firstOrCreate(['user_id' => $user->id], ['balance' => 25.00, 'currency' => 'NZD']);
    echo "  Listener: {$user->name} (ID {$user->id})\n";
}

// ----------------------------------------------------------------
// 4. SUMMARY
// ----------------------------------------------------------------
echo "\n[4/4] Database Summary:\n";
echo "  Users:    " . User::count()    . "\n";
echo "  Studios:  " . Studio::count()  . "\n";
echo "  Artists:  " . Artist::count()  . "\n";
echo "  Products: " . Product::count() . "\n";
echo "  Wallets:  " . Wallet::count()  . "\n";

echo "\n=== Seeding Complete! ===\n";
echo "You can log in as any of these accounts:\n";
echo "  Studio:   pacificwave@studio.com   / StudioPass123\n";
echo "  Artists:  hine@artist.com          / ArtistPass123\n";
echo "            toa@artist.com           / ArtistPass123\n";
echo "            mere@artist.com          / ArtistPass123\n";
echo "  Listener: aroha@listener.com       / ListenerPass123\n";
