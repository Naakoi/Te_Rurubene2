import 'dart:io';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:path/path.dart' as p;
import 'package:flutter/foundation.dart';

class UploadSession {
  final String uploadId;
  final String key;
  final int totalChunks;
  final int chunkSize;
  final String filePath;
  final String title;
  final String mediaType;
  final bool isPremium;
  final double price;

  UploadSession({
    required this.uploadId,
    required this.key,
    required this.totalChunks,
    required this.chunkSize,
    required this.filePath,
    required this.title,
    required this.mediaType,
    required this.isPremium,
    required this.price,
  });

  Map<String, dynamic> toJson() => {
    'uploadId': uploadId,
    'key': key,
    'totalChunks': totalChunks,
    'chunkSize': chunkSize,
    'filePath': filePath,
    'title': title,
    'mediaType': mediaType,
    'isPremium': isPremium,
    'price': price,
  };

  factory UploadSession.fromJson(Map<String, dynamic> json) {
    return UploadSession(
      uploadId: json['uploadId'],
      key: json['key'],
      totalChunks: json['totalChunks'],
      chunkSize: json['chunkSize'],
      filePath: json['filePath'],
      title: json['title'],
      mediaType: json['mediaType'],
      isPremium: json['isPremium'],
      price: json['price'],
    );
  }
}

class ChunkUploadManager {
  static final ChunkUploadManager _instance = ChunkUploadManager._internal();
  factory ChunkUploadManager() => _instance;
  ChunkUploadManager._internal();

  final int chunkSize = 5 * 1024 * 1024; // 5MB
  final String baseUrl = 'http://10.0.2.2:8000/api/upload/multipart'; // Android Emulator alias
  String? authToken;
  
  bool _isPaused = false;
  UploadSession? _currentSession;
  List<Map<String, dynamic>> _completedParts = [];
  
  Function(double progress)? onProgress;
  Function(String status)? onStatusChange;
  Function(String error)? onError;

  void setAuthToken(String token) {
    authToken = token;
  }

  Future<void> startUpload({
    required File file,
    required String title,
    required String mediaType,
    required bool isPremium,
    required double price,
  }) async {
    _isPaused = false;
    _completedParts = [];
    
    try {
      onStatusChange?.call('initializing');
      
      final int fileSize = await file.length();
      final int totalChunks = (fileSize / chunkSize).ceil();

      // 1. Init
      final initResponse = await http.post(
        Uri.parse('$baseUrl/init'),
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'file_name': p.basename(file.path),
          'media_type': mediaType,
          'file_type': 'application/octet-stream', // Generic binary
          'is_premium': isPremium,
          'price': price,
        }),
      );

      if (initResponse.statusCode != 200) {
        throw Exception('Failed to initialize upload: ${initResponse.body}');
      }

      final initData = jsonDecode(initResponse.body);
      
      _currentSession = UploadSession(
        uploadId: initData['upload_id'],
        key: initData['key'],
        totalChunks: totalChunks,
        chunkSize: chunkSize,
        filePath: file.path,
        title: title,
        mediaType: mediaType,
        isPremium: isPremium,
        price: price,
      );

      await _saveSessionState();
      await _processChunks(file);
      
    } catch (e) {
      onError?.call(e.toString());
      onStatusChange?.call('error');
    }
  }

  Future<void> _processChunks(File file) async {
    if (_currentSession == null) return;
    
    onStatusChange?.call('uploading');
    final session = _currentSession!;
    final randomAccessFile = await file.open(mode: FileMode.read);
    
    int nextPartToUpload = _completedParts.length + 1;

    try {
      for (int i = nextPartToUpload; i <= session.totalChunks; i++) {
        if (_isPaused) {
          onStatusChange?.call('paused');
          await randomAccessFile.close();
          return;
        }

        final int start = (i - 1) * session.chunkSize;
        await randomAccessFile.setPosition(start);
        
        final List<int> chunkData = await randomAccessFile.read(session.chunkSize);

        // 2. Presign Chunk
        final presignResponse = await http.post(
          Uri.parse('$baseUrl/presign'),
          headers: {
            'Authorization': 'Bearer $authToken',
            'Content-Type': 'application/json',
          },
          body: jsonEncode({
            'upload_id': session.uploadId,
            'key': session.key,
            'part_number': i,
          }),
        );

        if (presignResponse.statusCode != 200) {
          throw Exception('Failed to get presigned URL: ${presignResponse.body}');
        }

        final presignData = jsonDecode(presignResponse.body);
        final String presignedUrl = presignData['url'];

        // 3. Upload Chunk directly
        final uploadResponse = await http.put(
          Uri.parse(presignedUrl),
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          body: chunkData,
        );

        if (uploadResponse.statusCode != 200) {
          throw Exception('Failed to upload chunk $i');
        }

        final eTag = uploadResponse.headers['etag'] ?? uploadResponse.headers['ETag'];
        if (eTag != null) {
          _completedParts.add({'PartNumber': i, 'ETag': eTag});
          await _saveSessionState();
        }

        // Calculate and report progress
        final double progress = (i / session.totalChunks) * 100;
        onProgress?.call(progress);
      }

      await randomAccessFile.close();
      await _completeUpload();

    } catch (e) {
      await randomAccessFile.close();
      onError?.call(e.toString());
      onStatusChange?.call('error');
    }
  }

  Future<void> _completeUpload() async {
    if (_currentSession == null) return;
    final session = _currentSession!;

    onStatusChange?.call('processing');

    final completeResponse = await http.post(
      Uri.parse('$baseUrl/complete'),
      headers: {
        'Authorization': 'Bearer $authToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'upload_id': session.uploadId,
        'key': session.key,
        'parts': _completedParts,
        'title': session.title,
      }),
    );

    if (completeResponse.statusCode != 200) {
      throw Exception('Failed to complete upload: ${completeResponse.body}');
    }

    onStatusChange?.call('success');
    await _clearSessionState();
  }

  void pause() {
    _isPaused = true;
  }

  Future<void> resume() async {
    if (_currentSession == null) return;
    _isPaused = false;
    final file = File(_currentSession!.filePath);
    if (await file.exists()) {
      await _processChunks(file);
    } else {
      onError?.call('Original file not found.');
      await _clearSessionState();
    }
  }

  Future<void> _saveSessionState() async {
    if (_currentSession == null) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('upload_session', jsonEncode(_currentSession!.toJson()));
    await prefs.setString('upload_parts', jsonEncode(_completedParts));
  }

  Future<bool> checkForResumableUpload() async {
    final prefs = await SharedPreferences.getInstance();
    final sessionString = prefs.getString('upload_session');
    final partsString = prefs.getString('upload_parts');

    if (sessionString != null && partsString != null) {
      _currentSession = UploadSession.fromJson(jsonDecode(sessionString));
      
      final partsList = jsonDecode(partsString) as List;
      _completedParts = partsList.map((e) => e as Map<String, dynamic>).toList();
      
      _isPaused = true;
      return true; // Indicating a resumable upload exists
    }
    return false;
  }

  Future<void> _clearSessionState() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('upload_session');
    await prefs.remove('upload_parts');
    _currentSession = null;
    _completedParts = [];
  }
}
