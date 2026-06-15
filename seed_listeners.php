<?php
// Fix listener role - create listener/client users
require '/var/www/rurubene2/backend/vendor/autoload.php';
$app = require '/var/www/rurubene2/backend/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Profile;
use App\Models\Wallet;

echo "=== Creating Listener (client role) accounts ===\n";

$listeners = [
    ['name' => 'Aroha Williams',  'email' => 'aroha@listener.com',  'bio' => 'Pacific music lover from Wellington.'],
    ['name' => 'Sione Faleolo',   'email' => 'sione@listener.com',  'bio' => 'Samoan beats and R&B fan from Auckland.'],
    ['name' => 'Kezia Rangi',     'email' => 'kezia@listener.com',  'bio' => 'Jazz and soul enthusiast from Christchurch.'],
    ['name' => 'Tupou Fifita',    'email' => 'tupou@listener.com',  'bio' => 'Tongan music advocate and community organiser.'],
    ['name' => 'Maia Ngata',      'email' => 'maia@listener.com',   'bio' => 'Indie and Maori fusion fan from Hamilton.'],
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

echo "\n=== Summary ===\n";
echo "  Total Users:    " . User::count()    . "\n";
echo "  Total Products: " . \App\Models\Product::count() . "\n";
echo "=== Done! ===\n";
