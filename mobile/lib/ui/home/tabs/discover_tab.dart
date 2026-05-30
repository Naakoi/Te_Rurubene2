import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/controllers/data_controller.dart';
import '../../../core/models/data_models.dart';
import '../../../core/media_engine/queue_manager.dart';
import '../../../core/media_engine/media_player_controller.dart';
import '../../player/unified_player_screen.dart';
import '../cart_screen.dart';

class DiscoverTab extends StatelessWidget {
  const DiscoverTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: CustomScrollView(
        slivers: [
          // Header
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Good evening 👋', style: GoogleFonts.outfit(color: Colors.white38, fontSize: 13)),
                      const SizedBox(height: 4),
                      Text('Discover Music', style: GoogleFonts.outfit(
                          color: Colors.white, fontSize: 24, fontWeight: FontWeight.w700)),
                    ],
                  ),
                  Consumer<DataController>(
                    builder: (context, dataCtrl, child) {
                      return GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => CartScreen()),
                          );
                        },
                        child: Stack(
                          clipBehavior: Clip.none,
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: const LinearGradient(
                                    colors: [Color(0xFF6C63FF), Color(0xFF4FC3F7)]),
                              ),
                              child: const Icon(Icons.shopping_bag_outlined, color: Colors.white, size: 20),
                            ),
                            if (dataCtrl.cartItems.isNotEmpty)
                              Positioned(
                                top: -4,
                                right: -4,
                                child: Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: const BoxDecoration(
                                    color: Colors.redAccent,
                                    shape: BoxShape.circle,
                                  ),
                                  child: Text(
                                    '${dataCtrl.cartItems.length}',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),

          // Featured Banner
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
              child: Container(
                height: 190,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF1A1040), Color(0xFF6C63FF)],
                  ),
                ),
                child: Stack(
                  children: [
                    Positioned(
                      right: -20,
                      top: -20,
                      child: Container(
                        width: 160,
                        height: 160,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.05),
                        ),
                      ),
                    ),
                    Positioned(
                      right: 20,
                      bottom: -30,
                      child: Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.05),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(22),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text('FEATURED', style: GoogleFonts.outfit(
                                color: Colors.white70, fontSize: 10, letterSpacing: 1.5)),
                          ),
                          const Spacer(),
                          Text('Pacific Vibes\nPlaylist', style: GoogleFonts.outfit(
                              color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800,
                              height: 1.2)),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.play_arrow_rounded, color: Color(0xFF6C63FF), size: 18),
                                    const SizedBox(width: 4),
                                    Text('Play Now', style: GoogleFonts.outfit(
                                        color: const Color(0xFF6C63FF), fontSize: 12, fontWeight: FontWeight.w700)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Section: Trending
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 32, 20, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('🔥 Trending', style: GoogleFonts.outfit(
                      color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
                  Text('See all', style: GoogleFonts.outfit(
                      color: const Color(0xFF6C63FF), fontSize: 13)),
                ],
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: SizedBox(
              height: 170,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: 8,
                itemBuilder: (context, i) => _TrendingCard(index: i),
              ),
            ),
          ),

          // Section: New Releases
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 28, 20, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('✨ New Releases', style: GoogleFonts.outfit(
                      color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
                  Text('See all', style: GoogleFonts.outfit(
                      color: const Color(0xFF6C63FF), fontSize: 13)),
                ],
              ),
            ),
          ),

          Consumer<DataController>(
            builder: (context, dataCtrl, child) {
              if (dataCtrl.isLoading && dataCtrl.tracks.isEmpty) {
                return const SliverToBoxAdapter(
                  child: Center(child: CircularProgressIndicator()),
                );
              }
              
              if (dataCtrl.tracks.isEmpty) {
                return SliverToBoxAdapter(
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Text('No tracks available', style: GoogleFonts.outfit(color: Colors.white54)),
                    ),
                  ),
                );
              }
              
              return SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, i) => _TrackListItem(track: dataCtrl.tracks[i], index: i),
                  childCount: dataCtrl.tracks.length,
                ),
              );
            },
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }
}

class _TrendingCard extends StatelessWidget {
  final int index;
  static const _gradients = [
    [Color(0xFF6C63FF), Color(0xFF3F3D99)],
    [Color(0xFF4FC3F7), Color(0xFF0277BD)],
    [Color(0xFFFF6B6B), Color(0xFFB71C1C)],
    [Color(0xFF66BB6A), Color(0xFF1B5E20)],
    [Color(0xFFFFB74D), Color(0xFFE65100)],
    [Color(0xFFAB47BC), Color(0xFF4A148C)],
    [Color(0xFF26C6DA), Color(0xFF006064)],
    [Color(0xFFEC407A), Color(0xFF880E4F)],
  ];
  static const _labels = [
    'Pacific Beats', 'Island Vibes', 'Kiribati Soul', 'Tropical Chill',
    'Ocean Sounds', 'Night Drive', 'Acoustic Dawn', 'Groove Mix',
  ];

  const _TrendingCard({required this.index});

  @override
  Widget build(BuildContext context) {
    final grad = _gradients[index % _gradients.length];
    return Container(
      width: 130,
      margin: const EdgeInsets.only(right: 14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: grad),
      ),
      child: Stack(
        children: [
          Positioned(
            right: -15,
            top: -15,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.08),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.music_note_rounded, color: Colors.white, size: 22),
                ),
                const Spacer(),
                Text(_labels[index % _labels.length], style: GoogleFonts.outfit(
                    color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700)),
                const SizedBox(height: 2),
                Text('${(index + 1) * 24} tracks', style: GoogleFonts.outfit(
                    color: Colors.white60, fontSize: 11)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TrackListItem extends StatelessWidget {
  final TrackModel track;
  final int index;

  const _TrackListItem({required this.track, required this.index});

  void _showPurchaseDialog(BuildContext context, DataController dataCtrl) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF0F0F22),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Purchase Track', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Text(
          'Do you want to purchase "${track.title}" for \$${track.price} using your wallet balance?',
          style: GoogleFonts.outfit(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel', style: GoogleFonts.outfit(color: Colors.white38)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF6C63FF),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () async {
              Navigator.pop(context); // Close dialog
              final success = await dataCtrl.purchaseTrack(track.id);
              if (context.mounted) {
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Successfully purchased "${track.title}"! Added to Library.',
                          style: GoogleFonts.outfit()),
                      backgroundColor: const Color(0xFF66BB6A),
                    ),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Failed to purchase. Please check your wallet balance.',
                          style: GoogleFonts.outfit()),
                      backgroundColor: Colors.redAccent,
                    ),
                  );
                }
              }
            },
            child: Text('Buy Now', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dataCtrl = Provider.of<DataController>(context);
    final isLocked = track.isPremium && !track.isPurchased;
    final inCart = dataCtrl.isInCart(track.id, 'track');

    return GestureDetector(
      onTap: () {
        if (isLocked) {
          _showPurchaseDialog(context, dataCtrl);
          return;
        }

        final queue = context.read<QueueManager>();
        final player = context.read<MediaPlayerController>();
        
        final mediaItems = dataCtrl.tracks.map((t) => MediaItem(
          id: t.id.toString(),
          title: t.title,
          artist: t.artistName,
          streamUrl: t.streamUrl ?? '',
          coverUrl: t.coverUrl ?? 'https://placehold.co/400x400/1A1040/FFFFFF/png?text=Cover',
          isVideo: false,
        )).toList();
        
        queue.setQueue(mediaItems, initialIndex: index);
        
        final current = queue.currentItem;
        if (current != null) {
          player.playMedia(current.streamUrl, MediaType.audio);
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => UnifiedPlayerScreen()),
          );
        }
      },
      child: Container(
        margin: const EdgeInsets.fromLTRB(20, 0, 20, 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.04),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withOpacity(0.06)),
        ),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                color: const Color(0xFF6C63FF).withOpacity(0.2),
              ),
              child: track.coverUrl != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(track.coverUrl!, fit: BoxFit.cover),
                    )
                  : Center(
                      child: Text('${index + 1}', style: GoogleFonts.outfit(
                          color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
                    ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(track.title, style: GoogleFonts.outfit(
                      color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 3),
                  Text(track.artistName, style: GoogleFonts.outfit(
                      color: Colors.white38, fontSize: 12)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            if (isLocked)
               GestureDetector(
                 onTap: () {
                   final item = CartItem(
                     id: track.id,
                     title: track.title,
                     subtitle: track.artistName,
                     price: track.price,
                     imageUrl: track.coverUrl,
                     type: 'track',
                   );
                   if (inCart) {
                     dataCtrl.removeFromCart(item);
                     ScaffoldMessenger.of(context).showSnackBar(
                       SnackBar(
                         content: Text('"${track.title}" removed from cart'),
                         duration: const Duration(seconds: 1),
                       ),
                     );
                   } else {
                     dataCtrl.addToCart(item);
                     ScaffoldMessenger.of(context).showSnackBar(
                       SnackBar(
                         content: Text('"${track.title}" added to cart!'),
                         duration: const Duration(seconds: 1),
                         backgroundColor: const Color(0xFF6C63FF),
                       ),
                     );
                   }
                 },
                 child: AnimatedContainer(
                   duration: const Duration(milliseconds: 200),
                   padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                   decoration: BoxDecoration(
                     color: inCart ? Colors.green : const Color(0xFF6C63FF),
                     borderRadius: BorderRadius.circular(8),
                   ),
                   child: Row(
                     mainAxisSize: MainAxisSize.min,
                     children: [
                       Icon(
                         inCart ? Icons.shopping_bag_outlined : Icons.lock_outline,
                         color: Colors.white,
                         size: 12,
                       ),
                       const SizedBox(width: 4),
                       Text(
                         inCart ? 'IN CART' : '\$${track.price}',
                         style: GoogleFonts.outfit(
                           color: Colors.white,
                           fontSize: 10,
                           fontWeight: FontWeight.w700,
                         ),
                       ),
                     ],
                   ),
                 ),
               )
            else
               Text('${((track.duration ?? 0) ~/ 60)}:${((track.duration ?? 0) % 60).toString().padLeft(2, '0')}',
                   style: GoogleFonts.outfit(color: Colors.white38, fontSize: 12)),
            const SizedBox(width: 8),
            const Icon(Icons.more_vert, color: Colors.white24, size: 20),
          ],
        ),
      ),
    );
  }
}
