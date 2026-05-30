<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Plan;

class PlansSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name'        => 'Free',
                'slug'        => 'free',
                'price'       => 0.00,
                'interval'    => 'monthly',
                'description' => 'Listen to music with ads. Limited skips.',
                'features'    => json_encode([
                    'Unlimited listening with ads',
                    '6 skips per hour',
                    'Standard audio quality (128kbps)',
                    'Mobile & web access',
                ]),
                'is_active'   => true,
            ],
            [
                'name'        => 'Premium',
                'slug'        => 'premium',
                'price'       => 5.99,
                'interval'    => 'monthly',
                'description' => 'Ad-free listening with high-quality audio.',
                'features'    => json_encode([
                    'Ad-free listening',
                    'Unlimited skips',
                    'High quality audio (320kbps)',
                    'Offline downloads (up to 500 tracks)',
                    'Mobile, web & desktop access',
                    'Exclusive Kiribati content',
                ]),
                'is_active'   => true,
            ],
            [
                'name'        => 'Premium Yearly',
                'slug'        => 'premium-yearly',
                'price'       => 59.99,
                'interval'    => 'yearly',
                'description' => 'Premium plan, billed yearly. Save 2 months.',
                'features'    => json_encode([
                    'All Premium features',
                    '2 months free (billed annually)',
                    'Priority customer support',
                    'Early access to new features',
                ]),
                'is_active'   => true,
            ],
            [
                'name'        => 'Artist Pro',
                'slug'        => 'artist-pro',
                'price'       => 9.99,
                'interval'    => 'monthly',
                'description' => 'Full creator tools for Kiribati artists.',
                'features'    => json_encode([
                    'All Premium features',
                    'Advanced analytics dashboard',
                    'Priority track placement',
                    'Revenue statements & payouts',
                    'Beat marketplace access',
                    'Unlimited uploads',
                    'Ad campaign management',
                ]),
                'is_active'   => true,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(['slug' => $plan['slug']], $plan);
        }

        $this->command->info('Plans seeded successfully!');
    }
}
