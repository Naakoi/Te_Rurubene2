<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Order;
use App\Models\Event;
use App\Models\Ticket;
use App\Models\Artist;
use App\Models\Studio;
use App\Models\Track;
use App\Models\PurchasedTrack;
use App\Models\Transaction;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use App\Services\PurchaseService;
use Exception;

class CommerceController extends Controller
{
    protected $purchaseService;

    public function __construct(PurchaseService $purchaseService)
    {
        $this->purchaseService = $purchaseService;
    }
    /**
     * Get unified storefront data (products, tracks, videos)
     */
    public function getStorefront(Request $request, $type, $id)
    {
        $user = auth('sanctum')->user();

        if ($type === 'artist') {
            $creator = Artist::with('user')->findOrFail($id);
            $tracks = $creator->tracks()->with('artist.user')->latest()->get();
            $videos = $creator->videos()->latest()->get();
        } else {
            $creator = Studio::with('user')->findOrFail($id);
            $tracks = Track::whereIn('artist_id', $creator->artists()->pluck('id'))->with('artist.user')->latest()->get();
            $videos = $creator->videos()->latest()->get();
        }

        if ($user) {
            $purchasedIds = PurchasedTrack::where('user_id', $user->id)->pluck('track_id')->toArray();
            
            // Also get unified purchased track IDs
            $unifiedPurchasedIds = \App\Models\PurchasedContent::where('user_id', $user->id)
                ->whereIn('content_type', ['song', 'track'])
                ->pluck('content_id')
                ->toArray();

            $tracks->map(function ($track) use ($user, $purchasedIds, $unifiedPurchasedIds) {
                // User is the uploader/artist
                $isCreator = ($user->artist && $user->artist->id === $track->artist_id);
                
                $track->is_purchased = $isCreator || 
                                       in_array($track->id, $purchasedIds) || 
                                       in_array($track->id, $unifiedPurchasedIds);
                return $track;
            });
        }

        return response()->json([
            'creator' => $creator,
            'products' => $creator->products,
            'tracks' => $tracks,
            'videos' => $videos,
            'events' => $creator->events()->where('event_date', '>=', now())->orderBy('event_date')->get(),
        ]);
    }

    /**
     * List all public creator stores (artists with products)
     */
    public function listStores()
    {
        $artists = \App\Models\Artist::whereHas('products')->with('user')->get()->map(function($a) {
            $a->store_type = 'artist';
            return $a;
        });

        $studios = \App\Models\Studio::whereHas('products')->with('user')->get()->map(function($s) {
            $s->store_type = 'studio';
            return $s;
        });

        return response()->json($artists->concat($studios));
    }

    /**
     * List all upcoming events (public)
     */
    public function listEvents()
    {
        $events = Event::with('artist.user')
            ->where('event_date', '>=', now())
            ->orderBy('event_date')
            ->get();
        return response()->json($events);
    }

    /**
     * List artist merchandise products
     */
    public function listProducts($id)
    {
        return response()->json(Product::where('artist_id', $id)->orWhere('studio_id', $id)->get());
    }

    /**
     * List products by category
     */
    public function listByCategory($category)
    {
        return response()->json(Product::where('category', $category)->with(['artist.user', 'studio.user'])->get());
    }

    /**
     * Create an order for a product
     */
    public function createOrder(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'shipping_address' => 'required|string',
        ]);

        $product = Product::findOrFail($request->product_id);
        
        $order = Order::create([
            'user_id' => $request->user()->id,
            'total_amount' => $product->price,
            'shipping_address' => $request->shipping_address,
            'status' => 'pending'
        ]);

        return response()->json($order, 201);
    }

    /**
     * Complete checkout for cart items
     */
    public function checkout(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required',
            'items.*.type' => 'required|in:track,album,podcast,ticket,product',
            'items.*.price' => 'required|numeric',
        ]);

        $user = $request->user();

        try {
            $purchase = $this->purchaseService->processCheckout(
                $user, 
                $request->items
            );

            // Fetch actual platform fee from CreatorEarnings table for this purchase
            $platformFee = $purchase->earnings()->where('recipient_type', 'platform')->sum('amount');

            return response()->json([
                'message' => 'Checkout successful', 
                'purchase' => $purchase,
                'platform_fee' => (float)$platformFee,
                'balance' => $user->wallet()->first()->balance
            ]);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    /**
     * Get products owned by the authenticated artist or studio
     */
    public function myProducts(Request $request)
    {
        $user = $request->user();
        if ($user->role === 'artist') {
            return response()->json($user->artist->products);
        } elseif ($user->role === 'studio') {
            return response()->json($user->studio->products);
        }
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    /**
     * Store a new product
     */
    public function storeProduct(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock_quantity' => 'nullable|integer|min:0',
            'image_url' => 'nullable|string',
        ]);

        $user = $request->user();
        $data = $request->only(['name', 'description', 'price', 'stock_quantity', 'image_url', 'category']);

        if ($user->role === 'artist') {
            $product = $user->artist->products()->create($data);
        } elseif ($user->role === 'studio') {
            $product = $user->studio->products()->create($data);
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($product, 201);
    }

    /**
     * Update an existing product
     */
    public function updateProduct(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        $user = $request->user();

        // Check ownership
        if ($user->role === 'artist' && $product->artist_id !== $user->artist->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        if ($user->role === 'studio' && $product->studio_id !== $user->studio->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'stock_quantity' => 'nullable|integer|min:0',
            'image_url' => 'nullable|string',
        ]);

        $product->update($request->only(['name', 'description', 'price', 'stock_quantity', 'image_url', 'category']));

        return response()->json($product);
    }

    /**
     * Delete a product
     */
    public function deleteProduct(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        $user = $request->user();

        // Check ownership
        if ($user->role === 'artist' && $product->artist_id !== $user->artist->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        if ($user->role === 'studio' && $product->studio_id !== $user->studio->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product->delete();

        return response()->json(['message' => 'Product deleted successfully']);
    }

    /**
     * Buy a ticket to an event
     */
    public function buyTicket(Request $request, $eventId)
    {
        $event = Event::findOrFail($eventId);
        $user = $request->user();

        try {
            $ticket = $this->commerceService->purchaseTicket($user, $event);
            return response()->json([
                'message' => 'Ticket purchased successfully', 
                'ticket' => $ticket,
                'balance' => $user->wallet()->first()->balance
            ]);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}
