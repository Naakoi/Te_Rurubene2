import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:better_player/better_player.dart';
import 'package:just_audio/just_audio.dart';
import 'package:rxdart/rxdart.dart';

enum MediaType { audio, video }
enum PlaybackState { idle, loading, playing, paused, error }

class MediaPlayerController extends ChangeNotifier {
  MediaType _currentType = MediaType.audio;
  PlaybackState _state = PlaybackState.idle;
  
  final AudioPlayer _audioPlayer = AudioPlayer();
  BetterPlayerController? _videoController;
  
  // Streams for UI
  final BehaviorSubject<PlaybackState> _stateSubject = BehaviorSubject.seeded(PlaybackState.idle);
  Stream<PlaybackState> get stateStream => _stateSubject.stream;
  
  MediaType get currentType => _currentType;
  PlaybackState get state => _state;
  BetterPlayerController? get videoController => _videoController;
  
  bool get isVideoMode => _currentType == MediaType.video;

  // Initialize unified engine
  Future<void> initialize() async {
    // Setup listeners
    _audioPlayer.playerStateStream.listen((event) {
      if (event.playing) {
        _updateState(PlaybackState.playing);
      } else if (event.processingState == ProcessingState.loading) {
        _updateState(PlaybackState.loading);
      } else {
        _updateState(PlaybackState.paused);
      }
    });
  }

  void _updateState(PlaybackState newState) {
    _state = newState;
    _stateSubject.add(newState);
    notifyListeners();
  }

  void togglePlay() {
    if (_currentType == MediaType.audio) {
      if (_audioPlayer.playing) _audioPlayer.pause();
      else _audioPlayer.play();
    } else {
      if (_videoController?.isPlaying() ?? false) _videoController?.pause();
      else _videoController?.play();
    }
    notifyListeners();
  }

  Future<void> playMedia(String url, MediaType type) async {
    _currentType = type;
    
    if (type == MediaType.audio) {
      _videoController?.pause();
      _updateState(PlaybackState.loading);
      try {
        debugPrint("MediaPlayerController: Playing audio URL: '$url'");
        if (url.isEmpty) {
          throw Exception("Audio URL is empty!");
        }
        await _audioPlayer.setUrl(url);
        await _audioPlayer.play();
      } catch (e) {
        debugPrint("MediaPlayerController: Error loading/playing audio: $e");
        _updateState(PlaybackState.error);
      }
    } else {
      await _audioPlayer.pause();
      _setupVideoPlayer(url);
    }
    notifyListeners();
  }

  void _setupVideoPlayer(String url) {
    BetterPlayerDataSource dataSource = BetterPlayerDataSource(
      BetterPlayerDataSourceType.network,
      url,
      liveStream: false,
      useAsmsSubtitles: true,
      useAsmsTracks: true,
    );
    
    _videoController = BetterPlayerController(
      BetterPlayerConfiguration(
        autoPlay: true,
        aspectRatio: 16 / 9,
        fit: BoxFit.contain,
      ),
      betterPlayerDataSource: dataSource,
    );
  }

  Stream<Duration> get positionStream => _audioPlayer.positionStream;
  Stream<Duration?> get durationStream => _audioPlayer.durationStream;

  void seek(Duration position) {
    if (_currentType == MediaType.audio) {
      _audioPlayer.seek(position);
    }
  }

  void toggleAudioOnly() {
    if (_currentType == MediaType.video) {
      _currentType = MediaType.audio;
      // In a real app, we'd switch to an audio-only HLS stream or just hide the video
      notifyListeners();
    } else {
      _currentType = MediaType.video;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _audioPlayer.dispose();
    _videoController?.dispose();
    _stateSubject.close();
    super.dispose();
  }
}
