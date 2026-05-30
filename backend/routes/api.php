<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

use App\Http\Controllers\AuthController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->name('login');

Route::get('/podcasts', [\App\Http\Controllers\ContentController::class, 'listPodcasts']);
Route::get('/radio-stations', [\App\Http\Controllers\ContentController::class, 'listRadioStations']);
Route::get('/videos', [\App\Http\Controllers\ContentController::class, 'listVideos']);
Route::get('/videos/stream/{id}', [\App\Http\Controllers\StreamController::class, 'getStreamUrl']);
Route::get('/tracks', [\App\Http\Controllers\TrackController::class, 'index']);
Route::get('/tracks/{id}', [\App\Http\Controllers\TrackController::class, 'show']);
Route::get('/recommendations', [\App\Http\Controllers\RecommendationController::class, 'getRecommendations']);
Route::get('/search/semantic', [\App\Http\Controllers\RecommendationController::class, 'semanticSearch']);
Route::get('/stores', [\App\Http\Controllers\CommerceController::class, 'listStores']);
Route::get('/events', [\App\Http\Controllers\CommerceController::class, 'listEvents']);
Route::get('/products/category/{category}', [\App\Http\Controllers\CommerceController::class, 'listByCategory']);
Route::get('/storefront/{type}/{id}', [\App\Http\Controllers\CommerceController::class, 'getStorefront']);

// Creator Onboarding Public
Route::post('/creator/onboarding/register', [\App\Http\Controllers\CreatorOnboardingController::class, 'register']);

// Stripe Webhook — public but secured via Stripe-Signature header verification
Route::post('/webhooks/stripe', [\App\Http\Controllers\StripeWebhookController::class, 'handle'])
    ->name('webhooks.stripe');

// Public Podcast Routes
Route::get('/podcasts/discover', [\App\Http\Controllers\PodcastPublicController::class, 'discover']);
Route::get('/podcasts/categories', [\App\Http\Controllers\PodcastCategoryController::class, 'index']);
Route::get('/podcasts/channel/{id}', [\App\Http\Controllers\PodcastPublicController::class, 'showChannel']);
Route::get('/podcasts/episode/{id}', [\App\Http\Controllers\PodcastPublicController::class, 'showEpisode']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // Route::get('/videos/stream/{id}', ...) is now public (see above)
    Route::post('/tracks/{id}/purchase', [\App\Http\Controllers\TrackController::class, 'purchase']);
    Route::get('/my-tracks', [\App\Http\Controllers\TrackController::class, 'myTracks']);
    
    // Phase 2: Creator Economy Routes
    Route::get('/wallet', [\App\Http\Controllers\WalletController::class, 'index']);
    Route::get('/wallet/config', [\App\Http\Controllers\WalletController::class, 'getConfig']);
    Route::get('/wallet/earnings', [\App\Http\Controllers\WalletController::class, 'earnings']);
    Route::get('/wallet/library', [\App\Http\Controllers\WalletController::class, 'library']);
    Route::post('/wallet/topup/intent', [\App\Http\Controllers\WalletController::class, 'initializeTopup']);
    Route::post('/wallet/topup', [\App\Http\Controllers\WalletController::class, 'topup']); // Legacy/Deprecated
    Route::post('/wallet/redeem', [\App\Http\Controllers\RedeemCodeController::class, 'redeem']);
    
    // Secure Webhook Simulation (Public but Signed)
    Route::get('/webhooks/payment/simulate', [\App\Http\Controllers\WalletController::class, 'confirmSimulation'])
        ->name('payment.webhook.simulate');
    
    Route::get('/plans', [\App\Http\Controllers\SubscriptionController::class, 'plans']);
    Route::post('/subscribe', [\App\Http\Controllers\SubscriptionController::class, 'subscribe']);

    // Phase 3: Social & Media Routes
    Route::post('/comments', [\App\Http\Controllers\SocialController::class, 'addComment']);
    Route::post('/reactions', [\App\Http\Controllers\SocialController::class, 'toggleReaction']);
    Route::get('/stories/active', [\App\Http\Controllers\SocialController::class, 'activeStories']);

    Route::post('/live-events/{id}/chat', [\App\Http\Controllers\LiveEventController::class, 'sendChat']);

    // Phase 4: AI & Recommendation Routes
    Route::post('/smart-playlist', [\App\Http\Controllers\RecommendationController::class, 'generateSmartPlaylist']);

    // Auto-Play & History
    Route::post('/player/history/add', [\App\Http\Controllers\AutoPlayController::class, 'addToHistory']);
    Route::get('/player/queue/auto-play', [\App\Http\Controllers\AutoPlayController::class, 'getNext']);

    // Phase 5: Pacific Expansion Routes
    Route::get('/artists/{artistId}/products', [\App\Http\Controllers\CommerceController::class, 'listProducts']);
    Route::post('/orders', [\App\Http\Controllers\CommerceController::class, 'createOrder']);
    Route::post('/checkout', [\App\Http\Controllers\CommerceController::class, 'checkout']);
    Route::post('/events/{eventId}/tickets', [\App\Http\Controllers\CommerceController::class, 'buyTicket']);

    // Product Management (For Artists/Studios)
    Route::get('/my-products', [\App\Http\Controllers\CommerceController::class, 'myProducts']);
    Route::post('/products', [\App\Http\Controllers\CommerceController::class, 'storeProduct']);
    Route::put('/products/{id}', [\App\Http\Controllers\CommerceController::class, 'updateProduct']);
    Route::delete('/products/{id}', [\App\Http\Controllers\CommerceController::class, 'deleteProduct']);

    // Creator Onboarding
    Route::post('/creator/onboarding/independent', [\App\Http\Controllers\CreatorOnboardingController::class, 'setupIndependent']);
    Route::post('/creator/onboarding/studio/join', [\App\Http\Controllers\CreatorOnboardingController::class, 'setupStudioManaged']);
    
    // Role-based route placeholders
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/users', [\App\Http\Controllers\AdminController::class, 'listUsers']);
        Route::delete('/admin/users/{id}', [\App\Http\Controllers\AdminController::class, 'deleteUser']);
        Route::post('/admin/users/{id}/reset-password', [\App\Http\Controllers\AdminController::class, 'resetUserPassword']);
        
        Route::get('/admin/artists', [\App\Http\Controllers\AdminController::class, 'listArtists']);
        Route::post('/admin/artists/{id}/verify', [\App\Http\Controllers\AdminController::class, 'verifyArtist']);
        Route::get('/admin/stats', [\App\Http\Controllers\AdminController::class, 'platformStats']);
        Route::get('/admin/radio', [\App\Http\Controllers\AdminController::class, 'listStations']);
        Route::post('/admin/radio', [\App\Http\Controllers\AdminController::class, 'addStation']);
        Route::delete('/admin/radio/{id}', [\App\Http\Controllers\AdminController::class, 'deleteStation']);
        
        Route::get('/admin/settings', [\App\Http\Controllers\AdminController::class, 'getSettings']);
        Route::post('/admin/settings', [\App\Http\Controllers\AdminController::class, 'updateSettings']);

        // Redeem Codes Management
        Route::get('/admin/redeem-codes', [\App\Http\Controllers\RedeemCodeController::class, 'index']);
        Route::post('/admin/redeem-codes', [\App\Http\Controllers\RedeemCodeController::class, 'store']);
        Route::delete('/admin/redeem-codes/{id}', [\App\Http\Controllers\RedeemCodeController::class, 'destroy']);
    });

    Route::middleware('role:studio')->group(function () {
        Route::post('/studio/invite', [\App\Http\Controllers\CreatorOnboardingController::class, 'generateInvitation']);
        
        // Studio Podcast Management
        Route::get('/studio/podcasts', [\App\Http\Controllers\StudioPodcastController::class, 'index']);
        Route::post('/studio/podcasts', [\App\Http\Controllers\StudioPodcastController::class, 'store']);
        Route::get('/studio/podcasts/{id}', [\App\Http\Controllers\StudioPodcastController::class, 'show']);
        Route::post('/studio/podcasts/{id}/episodes', [\App\Http\Controllers\StudioPodcastController::class, 'storeEpisode']);
        Route::put('/studio/podcasts/{id}/episodes/{episodeId}', [\App\Http\Controllers\StudioPodcastController::class, 'updateEpisode']);
    });

    Route::middleware('role:artist')->group(function () {
        Route::get('/artist/analytics', [\App\Http\Controllers\AnalyticsController::class, 'artistDashboard']);
        Route::post('/videos/upload', [\App\Http\Controllers\ContentController::class, 'uploadVideo']);
        Route::post('/studio/upload', [\App\Http\Controllers\StudioController::class, 'upload']); // Keep old for fallback

        // New Direct-to-Cloud Upload Routes
        Route::post('/upload/multipart/init', [\App\Http\Controllers\MultipartUploadController::class, 'init']);
        Route::post('/upload/multipart/presign', [\App\Http\Controllers\MultipartUploadController::class, 'presign']);
        Route::post('/upload/multipart/complete', [\App\Http\Controllers\MultipartUploadController::class, 'complete']);
    });
});
