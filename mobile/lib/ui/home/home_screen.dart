import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/controllers/auth_controller.dart';
import '../../core/media_engine/media_player_controller.dart';
import '../../core/media_engine/queue_manager.dart';
import '../auth/login_screen.dart';
import '../player/unified_player_screen.dart';
import 'tabs/discover_tab.dart';
import 'tabs/library_tab.dart';
import 'tabs/search_tab.dart';
import 'tabs/marketplace_tab.dart';
import 'tabs/wallet_tab.dart';
import 'tabs/profile_tab.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  final List<Widget> _tabs = const [
    DiscoverTab(),
    SearchTab(),
    MarketplaceTab(),
    LibraryTab(),
    WalletTab(),
    ProfileTab(),
  ];

  @override
  Widget build(BuildContext context) {
    final queue = context.watch<QueueManager>();
    final player = context.watch<MediaPlayerController>();
    final currentItem = queue.currentItem;

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A1A),
      body: Column(
        children: [
          Expanded(
            child: IndexedStack(index: _selectedIndex, children: _tabs),
          ),
          if (currentItem != null)
            _MiniPlayer(currentItem: currentItem, player: player, queue: queue),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF0F0F22),
          border: Border(
            top: BorderSide(color: Colors.white.withOpacity(0.06)),
          ),
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Expanded(child: _NavItem(icon: Icons.explore_outlined, activeIcon: Icons.explore, label: 'Discover', index: 0, selected: _selectedIndex, onTap: (i) => setState(() => _selectedIndex = i))),
                Expanded(child: _NavItem(icon: Icons.search_outlined, activeIcon: Icons.search, label: 'Search', index: 1, selected: _selectedIndex, onTap: (i) => setState(() => _selectedIndex = i))),
                Expanded(child: _NavItem(icon: Icons.storefront_outlined, activeIcon: Icons.storefront, label: 'Market', index: 2, selected: _selectedIndex, onTap: (i) => setState(() => _selectedIndex = i))),
                Expanded(child: _NavItem(icon: Icons.library_music_outlined, activeIcon: Icons.library_music, label: 'Library', index: 3, selected: _selectedIndex, onTap: (i) => setState(() => _selectedIndex = i))),
                Expanded(child: _NavItem(icon: Icons.account_balance_wallet_outlined, activeIcon: Icons.account_balance_wallet, label: 'Wallet', index: 4, selected: _selectedIndex, onTap: (i) => setState(() => _selectedIndex = i))),
                Expanded(child: _NavItem(icon: Icons.person_outline, activeIcon: Icons.person, label: 'Profile', index: 5, selected: _selectedIndex, onTap: (i) => setState(() => _selectedIndex = i))),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final int index;
  final int selected;
  final ValueChanged<int> onTap;

  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.index,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isActive = index == selected;
    return GestureDetector(
      onTap: () => onTap(index),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFF6C63FF).withOpacity(0.15) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isActive ? activeIcon : icon,
              color: isActive ? const Color(0xFF6C63FF) : Colors.white38,
              size: 22,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: GoogleFonts.outfit(
                fontSize: 9,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                color: isActive ? const Color(0xFF6C63FF) : Colors.white38,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _MiniPlayer extends StatelessWidget {
  final MediaItem currentItem;
  final MediaPlayerController player;
  final QueueManager queue;

  const _MiniPlayer({
    required this.currentItem,
    required this.player,
    required this.queue,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const UnifiedPlayerScreen()),
        );
      },
      child: Container(
        height: 64,
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFF151538),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Stack(
            children: [
              // Real-time progress indicator at the top
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                child: StreamBuilder<Duration>(
                  stream: player.positionStream,
                  builder: (context, snapshotPos) {
                    final position = snapshotPos.data ?? Duration.zero;
                    return StreamBuilder<Duration?>(
                      stream: player.durationStream,
                      builder: (context, snapshotDur) {
                        final duration = snapshotDur.data ?? Duration.zero;
                        double progress = 0.0;
                        if (duration.inMilliseconds > 0) {
                          progress = position.inMilliseconds / duration.inMilliseconds;
                        }
                        return LinearProgressIndicator(
                          value: progress.clamp(0.0, 1.0),
                          backgroundColor: Colors.white.withOpacity(0.08),
                          valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF6C63FF)),
                        );
                      },
                    );
                  },
                ),
              ),
              
              // Content Row
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  children: [
                    // Album Cover / Icon
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        image: DecorationImage(
                          image: NetworkImage(currentItem.coverUrl),
                          fit: BoxFit.cover,
                          onError: (e, s) => const Icon(Icons.music_note, color: Colors.white),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    
                    // Track Title & Artist
                    Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            currentItem.title,
                            style: GoogleFonts.outfit(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            currentItem.artist,
                            style: GoogleFonts.outfit(
                              color: Colors.white60,
                              fontSize: 12,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    
                    // Play/Pause Action
                    StreamBuilder<PlaybackState>(
                      stream: player.stateStream,
                      builder: (context, snapshot) {
                        final state = snapshot.data ?? PlaybackState.idle;
                        final isPlaying = state == PlaybackState.playing;
                        final isLoading = state == PlaybackState.loading;
                        
                        if (isLoading) {
                          return const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 12),
                            child: SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            ),
                          );
                        }
                        
                        return IconButton(
                          icon: Icon(
                            isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                            color: Colors.white,
                            size: 28,
                          ),
                          onPressed: () => player.togglePlay(),
                        );
                      },
                    ),
                    
                    // Skip Next Action
                    IconButton(
                      icon: const Icon(
                        Icons.skip_next_rounded,
                        color: Colors.white70,
                        size: 28,
                      ),
                      onPressed: () {
                        if (queue.next()) {
                          final nextItem = queue.currentItem;
                          if (nextItem != null) {
                            player.playMedia(nextItem.streamUrl, MediaType.audio);
                          }
                        }
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
