import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/controllers/data_controller.dart';
import '../../../core/models/data_models.dart';

class LibraryTab extends StatelessWidget {
  const LibraryTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Your Library', style: GoogleFonts.outfit(
                      color: Colors.white, fontSize: 24, fontWeight: FontWeight.w700)),
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: const Color(0xFF6C63FF).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.add, color: Color(0xFF6C63FF), size: 22),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 28, 20, 12),
              child: Text('Recently Played', style: GoogleFonts.outfit(
                  color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600, letterSpacing: 0.5)),
            ),
          ),
          Consumer<DataController>(
            builder: (context, dataCtrl, child) {
              final myTracks = dataCtrl.tracks.where((t) => t.isPurchased || !t.isPremium).toList();
              if (myTracks.isEmpty) {
                return SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Text('No tracks yet', style: GoogleFonts.outfit(color: Colors.white54)),
                  ),
                );
              }
              return SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, i) => _LibraryItem(track: myTracks[i]),
                  childCount: myTracks.length,
                ),
              );
            },
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 28, 20, 12),
              child: Text('Saved Playlists', style: GoogleFonts.outfit(
                  color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600, letterSpacing: 0.5)),
            ),
          ),
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, i) => _PlaylistItem(index: i),
              childCount: 4,
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }
}

class _LibraryItem extends StatelessWidget {
  final TrackModel track;

  const _LibraryItem({required this.track});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 10),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.04),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              gradient: const LinearGradient(
                colors: [Color(0xFF6C63FF), Color(0xFF4FC3F7)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: track.coverUrl != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(track.coverUrl!, fit: BoxFit.cover),
                  )
                : const Icon(Icons.music_note_rounded, color: Colors.white, size: 22),
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
          const Icon(Icons.favorite, color: Color(0xFF6C63FF), size: 18),
        ],
      ),
    );
  }
}

class _PlaylistItem extends StatelessWidget {
  final int index;
  static const _names = ['My Favourites', 'Workout Mix', 'Chill Vibes', 'Pacific Classics'];
  static const _counts = [24, 15, 32, 18];

  const _PlaylistItem({required this.index});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 10),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.04),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
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
            child: const Icon(Icons.queue_music_rounded, color: Color(0xFF6C63FF), size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_names[index % _names.length], style: GoogleFonts.outfit(
                    color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15)),
                const SizedBox(height: 3),
                Text('${_counts[index % _counts.length]} songs', style: GoogleFonts.outfit(
                    color: Colors.white38, fontSize: 12)),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: Colors.white24, size: 22),
        ],
      ),
    );
  }
}
