import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/controllers/auth_controller.dart';
import '../../../core/controllers/data_controller.dart';
import '../../auth/login_screen.dart';

class ProfileTab extends StatelessWidget {
  const ProfileTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final user = auth.user;

    return SafeArea(
      child: CustomScrollView(
        slivers: [
          // Profile Hero
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 30, 20, 30),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    const Color(0xFF1A1040),
                    const Color(0xFF0A0A1A).withOpacity(0),
                  ],
                ),
              ),
              child: Column(
                children: [
                  Stack(
                    alignment: Alignment.bottomRight,
                    children: [
                      Container(
                        width: 96,
                        height: 96,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6C63FF), Color(0xFF4FC3F7)],
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF6C63FF).withOpacity(0.4),
                              blurRadius: 25,
                              spreadRadius: 3,
                            )
                          ],
                        ),
                        child: user?.avatar != null
                            ? ClipOval(child: Image.network(user!.avatar!, fit: BoxFit.cover))
                            : Center(
                                child: Text(
                                  (user?.name?.isNotEmpty == true)
                                      ? user!.name![0].toUpperCase()
                                      : '?',
                                  style: GoogleFonts.outfit(
                                      color: Colors.white, fontSize: 36, fontWeight: FontWeight.w800),
                                ),
                              ),
                      ),
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: const Color(0xFF6C63FF),
                          shape: BoxShape.circle,
                          border: Border.all(color: const Color(0xFF0A0A1A), width: 2),
                        ),
                        child: const Icon(Icons.edit, color: Colors.white, size: 14),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(user?.name ?? 'Listener', style: GoogleFonts.outfit(
                      color: Colors.white, fontSize: 22, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  Text(user?.email ?? '', style: GoogleFonts.outfit(
                      color: Colors.white38, fontSize: 13)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF6C63FF).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF6C63FF).withOpacity(0.4)),
                    ),
                    child: Text(
                      (user?.country != null && user!.country!.isNotEmpty)
                          ? '📍 ${user.country}'
                          : '🎵 Pacific Listener',
                      style: GoogleFonts.outfit(color: const Color(0xFF6C63FF), fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Stats Row
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
              child: Row(
                children: [
                  _StatBox(value: '128', label: 'Tracks\nPlayed'),
                  const SizedBox(width: 12),
                  _StatBox(value: '14', label: 'Playlists\nSaved'),
                  const SizedBox(width: 12),
                  _StatBox(value: '7', label: 'Albums\nBought'),
                ],
              ),
            ),
          ),

          // Settings List
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  _SettingsGroup(items: [
                    _SettingsItem(icon: Icons.person_outline, label: 'Edit Profile', onTap: () {}),
                    _SettingsItem(icon: Icons.notifications_outlined, label: 'Notifications', onTap: () {}),
                    _SettingsItem(icon: Icons.language_outlined, label: 'Language', onTap: () {}),
                  ]),
                  const SizedBox(height: 16),
                  _SettingsGroup(items: [
                    _SettingsItem(icon: Icons.payment_outlined, label: 'My Wallet', onTap: () {}),
                    _SettingsItem(icon: Icons.card_giftcard_outlined, label: 'Subscriptions', onTap: () {}),
                    _SettingsItem(icon: Icons.download_outlined, label: 'Downloads', onTap: () {}),
                  ]),
                  const SizedBox(height: 16),
                  _SettingsGroup(items: [
                    _SettingsItem(icon: Icons.help_outline, label: 'Help & Support', onTap: () {}),
                    _SettingsItem(icon: Icons.info_outline, label: 'About', onTap: () {}),
                    _SettingsItem(
                      icon: Icons.logout_rounded,
                      label: 'Sign Out',
                      destructive: true,
                      onTap: () async {
                        // Clear database and state on logout
                        if (context.mounted) {
                          context.read<DataController>().clearLocalAndState();
                        }
                        await auth.logout();
                        if (context.mounted) {
                          Navigator.of(context).pushAndRemoveUntil(
                            MaterialPageRoute(builder: (_) => const LoginScreen()),
                            (route) => false,
                          );
                        }
                      },
                    ),
                  ]),
                ],
              ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  final String value;
  final String label;
  const _StatBox({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withOpacity(0.07)),
        ),
        child: Column(
          children: [
            Text(value, style: GoogleFonts.outfit(
                color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
            const SizedBox(height: 4),
            Text(label, style: GoogleFonts.outfit(
                color: Colors.white38, fontSize: 11), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class _SettingsGroup extends StatelessWidget {
  final List<_SettingsItem> items;
  const _SettingsGroup({required this.items});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.04),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Column(
        children: items.asMap().entries.map((e) {
          final isLast = e.key == items.length - 1;
          return Column(
            children: [
              e.value,
              if (!isLast)
                Divider(
                  height: 1,
                  indent: 52,
                  color: Colors.white.withOpacity(0.06),
                ),
            ],
          );
        }).toList(),
      ),
    );
  }
}

class _SettingsItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool destructive;
  final VoidCallback onTap;

  const _SettingsItem({
    required this.icon,
    required this.label,
    this.destructive = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = destructive ? Colors.redAccent : Colors.white;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon, color: destructive ? Colors.redAccent : Colors.white54, size: 20),
            const SizedBox(width: 14),
            Expanded(
              child: Text(label, style: GoogleFonts.outfit(
                  color: color, fontSize: 15, fontWeight: FontWeight.w500)),
            ),
            if (!destructive)
              const Icon(Icons.chevron_right, color: Colors.white24, size: 20),
          ],
        ),
      ),
    );
  }
}
