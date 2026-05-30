import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/controllers/media_player_controller.dart';

class QueueBottomSheet extends StatelessWidget {
  const QueueBottomSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<MediaPlayerController>();
    final queue = controller.queue;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: Color(0xFF121212),
        borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Next Up',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (queue.isNotEmpty)
                TextButton(
                  onPressed: controller.clearQueue,
                  child: const Text('Clear Queue', style: TextStyle(color: Colors.redAccent)),
                ),
            ],
          ),
          const SizedBox(height: 15),
          Expanded(
            child: queue.isEmpty
                ? const Center(
                    child: Text(
                      'Queue is empty',
                      style: TextStyle(color: Colors.white54),
                    ),
                  )
                : ReorderableListView.builder(
                    itemCount: queue.length,
                    itemBuilder: (context, index) {
                      final item = queue[index];
                      return ListTile(
                        key: ValueKey(item.id),
                        leading: ClipRRect(
                          borderRadius: BorderRadius.circular(5),
                          child: Container(
                            width: 40,
                            height: 40,
                            color: Colors.grey[800],
                            child: const Icon(Icons.music_note, color: Colors.white, size: 20),
                          ),
                        ),
                        title: Text(
                          item.title,
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                        ),
                        subtitle: Text(
                          item.artist,
                          style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 12),
                        ),
                        trailing: const Icon(Icons.drag_handle, color: Colors.white54),
                      );
                    },
                    onReorder: (oldIndex, newIndex) {
                      // Logic to reorder queue in controller
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
