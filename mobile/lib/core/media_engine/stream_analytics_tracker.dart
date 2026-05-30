import 'dart:async';
import 'package:dio/dio.dart';

class StreamAnalyticsTracker {
  final Dio _dio = Dio();
  final String _baseUrl;
  
  StreamAnalyticsTracker(this._baseUrl);

  // Track when a stream starts
  Future<void> trackPlayStart(String mediaId, String type) async {
    try {
      await _dio.post('$_baseUrl/api/analytics/play', data: {
        'media_id': mediaId,
        'type': type,
        'timestamp': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      // Silently fail in production or log to local buffer
    }
  }

  // Track quality switches (useful for identifying bandwidth issues in Kiribati)
  Future<void> trackQualitySwitch(String mediaId, int height) async {
    try {
      await _dio.post('$_baseUrl/api/analytics/quality', data: {
        'media_id': mediaId,
        'resolution': '${height}p',
        'timestamp': DateTime.now().toIso8601String(),
      });
    } catch (e) {}
  }

  // Track buffering events
  Future<void> trackBuffering(String mediaId, Duration duration) async {
    try {
      await _dio.post('$_baseUrl/api/analytics/buffering', data: {
        'media_id': mediaId,
        'buffer_duration_ms': duration.inMilliseconds,
      });
    } catch (e) {}
  }
}
