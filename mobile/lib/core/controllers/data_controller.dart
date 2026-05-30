import 'package:flutter/foundation.dart';
import 'package:sqflite/sqflite.dart';
import 'package:dio/dio.dart';
import '../services/api_service.dart';
import '../services/database_helper.dart';
import '../models/data_models.dart';

class DataController extends ChangeNotifier {
  List<TrackModel> _tracks = [];
  List<ProductModel> _products = [];
  String _walletBalance = '0.00';
  bool _isLoading = false;

  List<TrackModel> get tracks => _tracks;
  List<ProductModel> get products => _products;
  String get walletBalance => _walletBalance;
  bool get isLoading => _isLoading;

  DataController() {
    _loadFromLocal();
    fetchData(); // Fetch from API in background
  }

  Future<void> _loadFromLocal() async {
    final db = await DatabaseHelper.instance.database;
    
    // Load tracks
    final trackMaps = await db.query('tracks');
    _tracks = trackMaps.map((e) => TrackModel.fromMap(e)).toList();

    // Load products
    final productMaps = await db.query('products');
    _products = productMaps.map((e) => ProductModel.fromMap(e)).toList();

    // Load wallet
    final walletRes = await db.query('wallet', limit: 1);
    if (walletRes.isNotEmpty) {
      _walletBalance = walletRes.first['balance'] as String;
    }

    notifyListeners();
  }

  Future<void> fetchData() async {
    _isLoading = true;
    notifyListeners();

    try {
      final db = await DatabaseHelper.instance.database;
      final api = ApiService.instance.client;

      // 1. Fetch Tracks
      try {
        final tracksResp = await api.get('/tracks');
        final trackList = (tracksResp.data as List).map((e) => TrackModel.fromJson(e)).toList();
        
        await db.delete('tracks'); // Clear old
        for (var t in trackList) {
          await db.insert('tracks', t.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
        }
        _tracks = trackList;
      } catch (e) {
        debugPrint('Failed to fetch tracks: $e');
      }

      // 2. Fetch Marketplace Products (let's assume /stores or /products/category/all)
      // Since /stores returns artists with products, let's parse them
      try {
        final storesResp = await api.get('/stores');
        List<ProductModel> productList = [];
        for (var store in storesResp.data) {
          if (store['products'] != null) {
            for (var p in store['products']) {
              p['artist'] = {'name': store['name']}; // inject store name
              productList.add(ProductModel.fromJson(p));
            }
          }
        }
        
        await db.delete('products');
        for (var p in productList) {
          await db.insert('products', p.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
        }
        _products = productList;
      } catch (e) {
        debugPrint('Failed to fetch products: $e');
      }

      // 3. Fetch Wallet
      try {
        final walletResp = await api.get('/wallet');
        _walletBalance = walletResp.data['balance']?.toString() ?? '0.00';
        
        await db.delete('wallet');
        await db.insert('wallet', {'id': 1, 'balance': _walletBalance});
      } catch (e) {
        debugPrint('Failed to fetch wallet: $e');
      }

    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> purchaseTrack(int trackId) async {
    try {
      final resp = await ApiService.instance.client.post('/tracks/$trackId/purchase');
      _walletBalance = resp.data['balance']?.toString() ?? _walletBalance;
      
      // Update local track to purchased
      final index = _tracks.indexWhere((t) => t.id == trackId);
      if (index != -1) {
        final updated = TrackModel(
          id: _tracks[index].id,
          title: _tracks[index].title,
          artistName: _tracks[index].artistName,
          coverUrl: _tracks[index].coverUrl,
          streamUrl: _tracks[index].streamUrl,
          duration: _tracks[index].duration,
          isPremium: _tracks[index].isPremium,
          price: _tracks[index].price,
          isPurchased: true,
        );
        _tracks[index] = updated;
        
        final db = await DatabaseHelper.instance.database;
        await db.update('tracks', updated.toMap(), where: 'id = ?', whereArgs: [trackId]);
        await db.update('wallet', {'balance': _walletBalance}, where: 'id = ?', whereArgs: [1]);
      }
      
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Purchase failed: $e');
      return false;
    }
  }

  Future<bool> initializeTopup(double amount) async {
    try {
      final api = ApiService.instance.client;
      // 1. Create topup intent in backend
      final resp = await api.post('/wallet/topup/intent', data: {
        'amount': amount,
        'source': 'stripe'
      });
      
      // 2. Extract and correct the host domain in the signed checkout URL
      final checkoutUrl = resp.data['checkout_url'] as String;
      final serverBaseUrl = ApiService.baseUrl; 
      final serverUri = Uri.parse(serverBaseUrl);
      final intentUri = Uri.parse(checkoutUrl);
      
      final correctedUri = intentUri.replace(
        scheme: serverUri.scheme,
        host: serverUri.host,
        port: serverUri.port,
      );
      
      // 3. Confirm simulation securely using the signed route with authorization headers
      await api.get(correctedUri.toString());
      
      // 4. Force state sync to update balance
      await fetchData();
      return true;
    } catch (e) {
      debugPrint('Topup failed: $e');
      return false;
    }
  }

  Future<Map<String, dynamic>> redeemCode(String code) async {
    try {
      final resp = await ApiService.instance.client.post('/wallet/redeem', data: {
        'code': code,
      });
      // Force data refresh to update wallet balance and list transactions
      await fetchData();
      return {
        'success': true,
        'message': resp.data['message'] ?? 'Code redeemed successfully!',
      };
    } catch (e) {
      String errMsg = 'Redeem failed. Please verify the code.';
      if (e is DioException && e.response?.data != null) {
        errMsg = e.response!.data['message'] ?? errMsg;
      }
      return {
        'success': false,
        'message': errMsg,
      };
    }
  }

  // Unified Cart & Purchase State Management
  final List<CartItem> _cartItems = [];
  List<CartItem> get cartItems => _cartItems;

  void addToCart(CartItem item) {
    if (!_cartItems.any((e) => e.id == item.id && e.type == item.type)) {
      _cartItems.add(item);
      notifyListeners();
    }
  }

  void removeFromCart(CartItem item) {
    _cartItems.removeWhere((e) => e.id == item.id && e.type == item.type);
    notifyListeners();
  }

  void clearCart() {
    _cartItems.clear();
    notifyListeners();
  }

  double get cartTotal {
    double total = 0.0;
    for (var item in _cartItems) {
      total += double.tryParse(item.price) ?? 0.0;
    }
    return total;
  }

  bool isInCart(int id, String type) {
    return _cartItems.any((e) => e.id == id && e.type == type);
  }

  Future<Map<String, dynamic>> checkoutCart() async {
    if (_cartItems.isEmpty) {
      return {'success': false, 'message': 'Your cart is empty'};
    }

    try {
      final itemsPayload = _cartItems.map((e) => {
        'id': e.id,
        'type': e.type,
        'price': double.tryParse(e.price) ?? 0.0,
      }).toList();

      final resp = await ApiService.instance.client.post('/checkout', data: {
        'items': itemsPayload,
      });

      // Clear local cart
      _cartItems.clear();

      // Force refresh data to sync wallet balance, purchase status, and library
      await fetchData();

      return {
        'success': true,
        'message': resp.data['message'] ?? 'Checkout completed successfully!',
      };
    } catch (e) {
      String errMsg = 'Checkout failed. Please try again.';
      if (e is DioException && e.response?.data != null) {
        errMsg = e.response!.data['message'] ?? errMsg;
      }
      return {
        'success': false,
        'message': errMsg,
      };
    }
  }

  Future<void> clearLocalAndState() async {
    _tracks = [];
    _products = [];
    _walletBalance = '0.00';
    _cartItems.clear();
    notifyListeners();

    final db = await DatabaseHelper.instance.database;
    await db.delete('tracks');
    await db.delete('products');
    await db.delete('wallet');
  }

  Future<void> refreshForNewUser() async {
    await clearLocalAndState();
    await fetchData();
  }
}
