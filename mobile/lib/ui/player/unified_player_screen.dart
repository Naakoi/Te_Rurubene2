import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:better_player/better_player.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/media_engine/media_player_controller.dart';
import '../../core/media_engine/queue_manager.dart';

class UnifiedPlayerScreen extends StatelessWidget {
  const UnifiedPlayerScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final player = Provider.of<MediaPlayerController>(context);
    final queue = Provider.of<QueueManager>(context);
    final currentItem = queue.currentItem;

    if (currentItem == null) {
      return const Scaffold(body: Center(child: Text("No media loaded")));
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.blueGrey.withOpacity(0.2),
              Colors.black,
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.keyboard_arrow_down, color: Colors.white, size: 30),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const Text(
                      "NOW PLAYING",
                      style: TextStyle(
                        color: Colors.white60,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 2,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.more_vert, color: Colors.white),
                      onPressed: () {},
                    ),
                  ],
                ),
              ),

              // Media Display Area (Video or Album Art)
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Center(
                    child: player.isVideoMode 
                      ? AspectRatio(
                          aspectRatio: 16 / 9,
                          child: BetterPlayer(controller: player.videoController!),
                        )
                      : Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(30),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.blue.withOpacity(0.2),
                                blurRadius: 40,
                                spreadRadius: 5,
                              )
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(30),
                            child: AspectRatio(
                              aspectRatio: 1,
                              child: CachedNetworkImage(
                                imageUrl: currentItem.coverUrl,
                                fit: BoxFit.cover,
                                width: double.infinity,
                              ),
                            ),
                          ),
                        ),
                  ),
                ),
              ),

              // Title & Artist
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 30),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            currentItem.title,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            currentItem.artist,
                            style: const TextStyle(
                              color: Colors.white60,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.favorite_border, color: Colors.white70),
                      onPressed: () {},
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 30),

              // Controls
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  children: [
                    // Dynamic Seek Slider
                    StreamBuilder<Duration>(
                      stream: player.positionStream,
                      builder: (context, snapshotPos) {
                        final position = snapshotPos.data ?? Duration.zero;
                        return StreamBuilder<Duration?>(
                          stream: player.durationStream,
                          builder: (context, snapshotDur) {
                            final duration = snapshotDur.data ?? Duration.zero;
                            final maxSec = duration.inSeconds.toDouble();
                            final valSec = position.inSeconds.toDouble().clamp(0.0, maxSec);
                            
                            return Column(
                              children: [
                                Slider(
                                  value: maxSec > 0 ? valSec : 0.0,
                                  max: maxSec > 0 ? maxSec : 1.0,
                                  onChanged: (v) {
                                    player.seek(Duration(seconds: v.toInt()));
                                  },
                                  activeColor: const Color(0xFF6C63FF),
                                  inactiveColor: Colors.white10,
                                ),
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 20),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        '${position.inMinutes}:${(position.inSeconds % 60).toString().padLeft(2, '0')}',
                                        style: const TextStyle(color: Colors.white38, fontSize: 12),
                                      ),
                                      Text(
                                        '${duration.inMinutes}:${(duration.inSeconds % 60).toString().padLeft(2, '0')}',
                                        style: const TextStyle(color: Colors.white38, fontSize: 12),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            );
                          },
                        );
                      },
                    ),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        IconButton(
                          icon: Icon(
                            Icons.shuffle, 
                            color: queue.isShuffle ? const Color(0xFF6C63FF) : Colors.white60
                          ),
                          onPressed: () => queue.toggleShuffle(),
                        ),
                        IconButton(
                          icon: const Icon(Icons.skip_previous, color: Colors.white, size: 40),
                          onPressed: () {
                            if (queue.previous() && queue.currentItem != null) {
                              player.playMedia(queue.currentItem!.streamUrl, MediaType.audio);
                            }
                          },
                        ),
                        GestureDetector(
                          onTap: () => player.togglePlay(),
                          child: Container(
                            width: 80,
                            height: 80,
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              player.state == PlaybackState.playing ? Icons.pause : Icons.play_arrow,
                              color: Colors.black,
                              size: 45,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.skip_next, color: Colors.white, size: 40),
                          onPressed: () {
                            if (queue.next() && queue.currentItem != null) {
                              player.playMedia(queue.currentItem!.streamUrl, MediaType.audio);
                            }
                          },
                        ),
                        IconButton(
                          icon: Icon(
                            Icons.repeat,
                            color: queue.repeatMode != RepeatMode.off ? const Color(0xFF6C63FF) : Colors.white60
                          ),
                          onPressed: () {
                            // Cycle repeat mode
                            if (queue.repeatMode == RepeatMode.off) {
                              queue.setRepeatMode(RepeatMode.all);
                            } else if (queue.repeatMode == RepeatMode.all) {
                              queue.setRepeatMode(RepeatMode.one);
                            } else {
                              queue.setRepeatMode(RepeatMode.off);
                            }
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Bottom Tools (Mode Switchers)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 30, horizontal: 40),
                child: Container(
                  padding: const EdgeInsets.all(5),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => player.toggleAudioOnly(),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: !player.isVideoMode ? Colors.white10 : Colors.transparent,
                              borderRadius: BorderRadius.circular(15),
                            ),
                            child: const Center(
                              child: Text(
                                "AUDIO",
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10),
                              ),
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => player.toggleAudioOnly(),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: player.isVideoMode ? Colors.white10 : Colors.transparent,
                              borderRadius: BorderRadius.circular(15),
                            ),
                            child: const Center(
                              child: Text(
                                "VIDEO",
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
