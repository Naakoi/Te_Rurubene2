import '../services/api_service.dart';

class TrackModel {
  final int id;
  final String title;
  final String artistName;
  final String? coverUrl;
  final String? streamUrl;
  final int? duration;
  final bool isPremium;
  final String price;
  final bool isPurchased;

  TrackModel({
    required this.id,
    required this.title,
    required this.artistName,
    this.coverUrl,
    this.streamUrl,
    this.duration,
    this.isPremium = false,
    this.price = '0.00',
    this.isPurchased = false,
  });

  factory TrackModel.fromJson(Map<String, dynamic> json) {
    final baseUrl = ApiService.baseUrl.replaceAll('/api', '');
    
    final rawCover = json['cover_url'] as String?;
    final cover = ApiService.cleanUrl(rawCover != null 
        ? (rawCover.startsWith('http') ? rawCover : '$baseUrl/storage/$rawCover')
        : null);

    final rawStream = json['audio_file_path'] as String?;
    final stream = ApiService.cleanUrl(rawStream != null 
        ? (rawStream.startsWith('http') ? rawStream : '$baseUrl/storage/$rawStream')
        : null);

    return TrackModel(
      id: json['id'],
      title: json['title'],
      artistName: json['artist']?['name'] ?? 'Unknown Artist',
      coverUrl: cover,
      streamUrl: stream,
      duration: json['duration'],
      isPremium: json['is_premium'] == 1 || json['is_premium'] == true,
      price: json['price']?.toString() ?? '0.00',
      isPurchased: json['is_purchased'] == 1 || json['is_purchased'] == true,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'artist_name': artistName,
      'cover_url': coverUrl,
      'stream_url': streamUrl,
      'duration': duration,
      'is_premium': isPremium ? 1 : 0,
      'price': price,
      'is_purchased': isPurchased ? 1 : 0,
    };
  }

  factory TrackModel.fromMap(Map<String, dynamic> map) {
    return TrackModel(
      id: map['id'],
      title: map['title'],
      artistName: map['artist_name'],
      coverUrl: ApiService.cleanUrl(map['cover_url']),
      streamUrl: ApiService.cleanUrl(map['stream_url']),
      duration: map['duration'],
      isPremium: map['is_premium'] == 1,
      price: map['price'],
      isPurchased: map['is_purchased'] == 1,
    );
  }
}

class ProductModel {
  final int id;
  final String name;
  final String? description;
  final String price;
  final String? imageUrl;
  final String? category;
  final String artistName;

  ProductModel({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    this.imageUrl,
    this.category,
    required this.artistName,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    final baseUrl = ApiService.baseUrl.replaceAll('/api', '');
    final rawImg = json['image_url'] as String?;
    final image = ApiService.cleanUrl(rawImg != null 
        ? (rawImg.startsWith('http') ? rawImg : '$baseUrl/storage/$rawImg')
        : null);

    return ProductModel(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      price: json['price']?.toString() ?? '0.00',
      imageUrl: image,
      category: json['category'],
      artistName: json['artist']?['name'] ?? json['studio']?['name'] ?? 'Unknown',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'image_url': imageUrl,
      'category': category,
      'artist_name': artistName,
    };
  }

  factory ProductModel.fromMap(Map<String, dynamic> map) {
    return ProductModel(
      id: map['id'],
      name: map['name'],
      description: map['description'],
      price: map['price'],
      imageUrl: ApiService.cleanUrl(map['image_url']),
      category: map['category'],
      artistName: map['artist_name'],
    );
  }
}

class CartItem {
  final int id;
  final String title;
  final String subtitle;
  final String price;
  final String? imageUrl;
  final String type; // 'track' or 'product'

  CartItem({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.price,
    this.imageUrl,
    required this.type,
  });
}
