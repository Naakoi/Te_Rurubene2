import 'dart:math';
import 'package:flutter/foundation.dart';

class MediaItem {
  final String id;
  final String title;
  final String artist;
  final String streamUrl;
  final String coverUrl;
  final bool isVideo;

  MediaItem({
    required this.id,
    required this.title,
    required this.artist,
    required this.streamUrl,
    required this.coverUrl,
    this.isVideo = false,
  });
}

enum RepeatMode { off, one, all }

class QueueManager extends ChangeNotifier {
  List<MediaItem> _originalQueue = [];
  List<MediaItem> _currentQueue = [];
  int _currentIndex = -1;
  
  bool _isShuffle = false;
  RepeatMode _repeatMode = RepeatMode.off;

  List<MediaItem> get queue => _currentQueue;
  int get currentIndex => _currentIndex;
  MediaItem? get currentItem => _currentIndex >= 0 && _currentIndex < _currentQueue.length 
      ? _currentQueue[_currentIndex] 
      : null;

  bool get isShuffle => _isShuffle;
  RepeatMode get repeatMode => _repeatMode;

  void setQueue(List<MediaItem> items, {int initialIndex = 0}) {
    _originalQueue = List.from(items);
    _currentQueue = List.from(items);
    _currentIndex = initialIndex;
    if (_isShuffle) {
      _shuffleQueue();
    }
    notifyListeners();
  }

  void toggleShuffle() {
    _isShuffle = !_isShuffle;
    if (_isShuffle) {
      _shuffleQueue();
    } else {
      _resetQueue();
    }
    notifyListeners();
  }

  void setRepeatMode(RepeatMode mode) {
    _repeatMode = mode;
    notifyListeners();
  }

  void _shuffleQueue() {
    if (_currentQueue.isEmpty) return;
    MediaItem? current = currentItem;
    _currentQueue.shuffle(Random());
    if (current != null) {
      _currentQueue.remove(current);
      _currentQueue.insert(0, current);
      _currentIndex = 0;
    }
  }

  void _resetQueue() {
    MediaItem? current = currentItem;
    _currentQueue = List.from(_originalQueue);
    if (current != null) {
      _currentIndex = _currentQueue.indexOf(current);
    }
  }

  bool next() {
    if (_currentQueue.isEmpty) return false;
    
    if (_repeatMode == RepeatMode.one) {
      // Stay on same index
      return true;
    }

    if (_currentIndex < _currentQueue.length - 1) {
      _currentIndex++;
      notifyListeners();
      return true;
    } else if (_repeatMode == RepeatMode.all) {
      _currentIndex = 0;
      notifyListeners();
      return true;
    }
    return false;
  }

  bool previous() {
    if (_currentIndex > 0) {
      _currentIndex--;
      notifyListeners();
      return true;
    }
    return false;
  }
}
