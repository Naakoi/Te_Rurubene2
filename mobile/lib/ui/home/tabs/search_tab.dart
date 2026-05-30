import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SearchTab extends StatefulWidget {
  const SearchTab({Key? key}) : super(key: key);

  @override
  State<SearchTab> createState() => _SearchTabState();
}

class _SearchTabState extends State<SearchTab> {
  final _searchCtrl = TextEditingController();
  bool _hasFocus = false;

  final List<Map<String, dynamic>> _categories = [
    {'label': 'Pacific Pop', 'icon': Icons.waves_rounded, 'color': const Color(0xFF6C63FF)},
    {'label': 'Traditional', 'icon': Icons.account_balance_rounded, 'color': const Color(0xFF4FC3F7)},
    {'label': 'Gospel', 'icon': Icons.church_rounded, 'color': const Color(0xFFFF6B6B)},
    {'label': 'Hip Hop', 'icon': Icons.mic_rounded, 'color': const Color(0xFF66BB6A)},
    {'label': 'Acoustic', 'icon': Icons.music_note, 'color': const Color(0xFFFFB74D)},
    {'label': 'Electronic', 'icon': Icons.electric_bolt, 'color': const Color(0xFFAB47BC)},
    {'label': 'Podcasts', 'icon': Icons.podcasts, 'color': const Color(0xFF26C6DA)},
    {'label': 'Live Events', 'icon': Icons.live_tv_rounded, 'color': const Color(0xFFEC407A)},
  ];

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
              child: Text('Search', style: GoogleFonts.outfit(
                  color: Colors.white, fontSize: 24, fontWeight: FontWeight.w700)),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Focus(
                onFocusChange: (f) => setState(() => _hasFocus = f),
                child: TextFormField(
                  controller: _searchCtrl,
                  style: GoogleFonts.outfit(color: Colors.white, fontSize: 15),
                  decoration: InputDecoration(
                    hintText: 'Songs, artists, albums...',
                    hintStyle: GoogleFonts.outfit(color: Colors.white38, fontSize: 14),
                    prefixIcon: Icon(Icons.search, color: _hasFocus ? const Color(0xFF6C63FF) : Colors.white38, size: 22),
                    filled: true,
                    fillColor: Colors.white.withOpacity(0.07),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: Color(0xFF6C63FF), width: 1.5),
                    ),
                    contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 32, 20, 16),
              child: Text('Browse Categories', style: GoogleFonts.outfit(
                  color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 2.2,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, i) {
                  final cat = _categories[i];
                  return Container(
                    decoration: BoxDecoration(
                      color: (cat['color'] as Color).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: (cat['color'] as Color).withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const SizedBox(width: 16),
                        Icon(cat['icon'] as IconData, color: cat['color'] as Color, size: 22),
                        const SizedBox(width: 10),
                        Text(cat['label'] as String, style: GoogleFonts.outfit(
                            color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
                      ],
                    ),
                  );
                },
                childCount: _categories.length,
              ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }
}
