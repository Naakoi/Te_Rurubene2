import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import 'package:audio_service/audio_service.dart';

enum PlayerMode { audio, video }

class MediaItemData {
  final String id;
  final String title;
  final String artist;
  final String? artUri;
  final String streamUrl;
  final PlayerMode mode;

  MediaItemData({
    required this.id,
    required this.title,
    required this.artist,
    this.artUri,
    required this.streamUrl,
    required this.mode,
  });
}

class MediaPlayerController extends ChangeNotifier {
  final AudioPlayer _audioPlayer = AudioPlayer();
  
  MediaItemData? _currentMedia;
  List<MediaItemData> _queue = [];
  bool _isPlaying = false;
  PlayerMode _currentMode = PlayerMode.audio;

  MediaItemData? get currentMedia => _currentMedia;
  List<MediaItemData> get queue => _queue;
  bool get isPlaying => _isPlaying;
  PlayerMode get currentMode => _currentMode;

  MediaPlayerController() {
    _initListeners();
  }

  void _initListeners() {
    _audioPlayer.playerStateStream.listen((state) {
      _isPlaying = state.playing;
      notifyListeners();
      
      if (state.processingState == ProcessingState.completed) {
        playNext();
      }
    });
  }

  Future<void> playMedia(MediaItemData item) async {
    _currentMedia = item;
    _currentMode = item.mode;
    
    if (item.mode == PlayerMode.audio) {
      await _audioPlayer.setUrl(item.streamUrl);
      _audioPlayer.play();
    } else {
      // Logic for video player would go here
      _audioPlayer.stop();
    }
    
    notifyListeners();
  }

  void togglePlay() {
    if (_isPlaying) {
      _audioPlayer.pause();
    } else {
      _audioPlayer.play();
    }
  }

  void playNext() {
    if (_queue.isNotEmpty) {
      final nextItem = _queue.removeAt(0);
      playMedia(nextItem);
    }
  }

  void addToQueue(MediaItemData item) {
    _queue.add(item);
    notifyListeners();
  }

  void clearQueue() {
    _queue.clear();
    notifyListeners();
  }

  @override
  void dispose() {
    _audioPlayer.dispose();
    super.dispose();
  }
}
