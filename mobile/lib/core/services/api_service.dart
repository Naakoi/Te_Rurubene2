import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static final ApiService instance = ApiService._init();
  late final Dio _dio;
  final _storage = const FlutterSecureStorage();

  static const String baseUrl = 'http://10.1.11.188:8000/api';

  ApiService._init() {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 15),
        headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'auth_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (err, handler) {
          handler.next(err);
        },
      ),
    );
  }

  Dio get client => _dio;

  static String? cleanUrl(String? url) {
    if (url == null) return null;
    
    final uri = Uri.parse(baseUrl);
    final host = uri.host;

    var cleaned = url;
    cleaned = cleaned.replaceAll('127.0.0.1', host);
    cleaned = cleaned.replaceAll('localhost', host);
    return cleaned;
  }
}
