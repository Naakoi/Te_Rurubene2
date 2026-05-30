import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../services/api_service.dart';
import '../models/user_profile.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthController extends ChangeNotifier {
  final _storage = const FlutterSecureStorage();

  AuthStatus _status = AuthStatus.unknown;
  UserProfile? _user;
  String? _errorMessage;
  bool _isLoading = false;

  AuthStatus get status => _status;
  UserProfile? get user => _user;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _isLoading;

  AuthController() {
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final token = await _storage.read(key: 'auth_token');
    if (token == null) {
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return;
    }
    try {
      final resp = await ApiService.instance.client.get('/me');
      final data = resp.data['user'];
      _user = _mapUser(data);
      _status = AuthStatus.authenticated;
    } catch (_) {
      await _storage.delete(key: 'auth_token');
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final resp = await ApiService.instance.client.post('/login', data: {
        'email': email,
        'password': password,
      });
      final token = resp.data['access_token'];
      await _storage.write(key: 'auth_token', value: token);
      _user = _mapUser(resp.data['user']);
      _status = AuthStatus.authenticated;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = _parseError(e);
      _status = AuthStatus.unauthenticated;
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String name, String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final resp = await ApiService.instance.client.post('/register', data: {
        'name': name,
        'email': email,
        'password': password,
        'password_confirmation': password,
        'role': 'client',
      });
      final token = resp.data['access_token'];
      await _storage.write(key: 'auth_token', value: token);
      _user = _mapUser(resp.data['user']);
      _status = AuthStatus.authenticated;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = _parseError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await ApiService.instance.client.post('/logout');
    } catch (_) {}
    await _storage.delete(key: 'auth_token');
    _user = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  UserProfile _mapUser(Map data) => UserProfile(
        userId: data['id'],
        name: data['name'],
        email: data['email'],
        role: data['role'],
        language: data['language'],
        darkMode: (data['dark_mode'] == true || data['dark_mode'] == 1) ? 1 : 0,
        bio: data['profile']?['bio'],
        avatar: ApiService.cleanUrl(data['profile']?['avatar']),
        coverImage: ApiService.cleanUrl(data['profile']?['cover_image']),
        country: data['profile']?['country'],
        island: data['profile']?['island'],
      );

  String _parseError(dynamic e) {
    try {
      final errors = e.response?.data?['errors'];
      if (errors != null) {
        return (errors as Map).values.first[0].toString();
      }
      return e.response?.data?['message'] ?? 'Something went wrong.';
    } catch (_) {
      return 'Network error. Check your connection.';
    }
  }
}
