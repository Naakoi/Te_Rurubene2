import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/services/api_service.dart';
import '../../core/media_engine/unified_audio_handler.dart';

class PodcastChannelScreen extends StatefulWidget {
  final int podcastId;

  const PodcastChannelScreen({Key? key, required this.podcastId}) : super(key: key);

  @override
  _PodcastChannelScreenState createState() => _PodcastChannelScreenState();
}

class _PodcastChannelScreenState extends State<PodcastChannelScreen> {
  Map<String, dynamic>? podcast;
  bool isLoading = true;
  bool isFollowing = false;

  @override
  void initState() {
    super.initState();
    _loadPodcast();
  }

  Future<void> _loadPodcast() async {
    try {
      final response = await ApiService.get('/podcasts/channel/${widget.podcastId}');
      setState(() {
        podcast = response.data;
        isLoading = false;
      });
    } catch (e) {
      print('Error loading podcast: $e');
      setState(() => isLoading = false);
    }
  }

  void _playEpisode(Map<String, dynamic> episode) {
    final audioHandler = Provider.of<UnifiedAudioHandler>(context, listen: false);
    audioHandler.playPodcastEpisode(
      id: 'podcast_${episode['id']}',
      title: episode['title'],
      podcastName: podcast!['title'],
      coverUrl: podcast!['cover_image'] ?? 'https://via.placeholder.com/150',
      audioUrl: episode['hls_path'],
      duration: episode['duration'] ?? 0,
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(child: CircularProgressIndicator(color: Theme.of(context).primaryColor)),
      );
    }

    if (podcast == null) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(backgroundColor: Colors.transparent),
        body: Center(child: Text('Podcast not found', style: TextStyle(color: Colors.white54))),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            backgroundColor: Colors.black,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  podcast!['cover_image'] != null
                      ? Image.network(podcast!['cover_image'], fit: BoxFit.cover)
                      : Container(color: Colors.grey[900], child: Icon(Icons.mic, size: 64, color: Colors.white24)),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Colors.black],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 20,
                    left: 20,
                    right: 20,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('PODCAST', style: TextStyle(color: Colors.white54, fontSize: 12, letterSpacing: 2, fontWeight: FontWeight.bold)),
                        SizedBox(height: 4),
                        Text(
                          podcast!['title'],
                          style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900),
                        ),
                        SizedBox(height: 8),
                        Text(
                          podcast!['studio'] != null ? podcast!['studio']['name'] : 'Studio',
                          style: TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Row(
                children: [
                  ElevatedButton(
                    onPressed: () => _playEpisode(podcast!['episodes'][0]),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).primaryColor,
                      shape: CircleBorder(),
                      padding: EdgeInsets.all(16),
                    ),
                    child: Icon(Icons.play_arrow, color: Colors.black, size: 32),
                  ),
                  SizedBox(width: 16),
                  OutlinedButton(
                    onPressed: () => setState(() => isFollowing = !isFollowing),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: Colors.white30),
                      shape: StadiumBorder(),
                    ),
                    child: Text(isFollowing ? 'FOLLOWING' : 'FOLLOW', style: TextStyle(color: Colors.white)),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
              child: Text(
                podcast!['description'] ?? '',
                style: TextStyle(color: Colors.white70, fontSize: 14, height: 1.5),
              ),
            ),
          ),
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final episode = podcast!['episodes'][index];
                return ListTile(
                  contentPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  title: Text(episode['title'], style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  subtitle: Padding(
                    padding: const EdgeInsets.only(top: 4.0),
                    child: Text(
                      episode['description'] ?? '',
                      style: TextStyle(color: Colors.white54),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  trailing: IconButton(
                    icon: Icon(Icons.play_circle_outline, color: Colors.white),
                    onPressed: () => _playEpisode(episode),
                  ),
                  onTap: () => _playEpisode(episode),
                );
              },
              childCount: podcast!['episodes']?.length ?? 0,
            ),
          ),
          SliverToBoxAdapter(child: SizedBox(height: 100)), // Bottom padding
        ],
      ),
    );
  }
}
