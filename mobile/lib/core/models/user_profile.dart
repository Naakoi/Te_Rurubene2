class UserProfile {
  final int? id;
  final int? userId;
  final String? name;
  final String? email;
  final String? role;
  final String? language;
  final int? darkMode;
  final String? bio;
  final String? avatar;
  final String? coverImage;
  final String? country;
  final String? island;

  UserProfile({
    this.id,
    this.userId,
    this.name,
    this.email,
    this.role,
    this.language,
    this.darkMode,
    this.bio,
    this.avatar,
    this.coverImage,
    this.country,
    this.island,
  });

  UserProfile copyWith({
    int? id,
    int? userId,
    String? name,
    String? email,
    String? role,
    String? language,
    int? darkMode,
    String? bio,
    String? avatar,
    String? coverImage,
    String? country,
    String? island,
  }) {
    return UserProfile(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      email: email ?? this.email,
      role: role ?? this.role,
      language: language ?? this.language,
      darkMode: darkMode ?? this.darkMode,
      bio: bio ?? this.bio,
      avatar: avatar ?? this.avatar,
      coverImage: coverImage ?? this.coverImage,
      country: country ?? this.country,
      island: island ?? this.island,
    );
  }

  Map<String, Object?> toJson() => {
        'id': id,
        'user_id': userId,
        'name': name,
        'email': email,
        'role': role,
        'language': language,
        'dark_mode': darkMode,
        'bio': bio,
        'avatar': avatar,
        'cover_image': coverImage,
        'country': country,
        'island': island,
      };

  static UserProfile fromJson(Map<String, Object?> json) => UserProfile(
        id: json['id'] as int?,
        userId: json['user_id'] as int?,
        name: json['name'] as String?,
        email: json['email'] as String?,
        role: json['role'] as String?,
        language: json['language'] as String?,
        darkMode: json['dark_mode'] as int?,
        bio: json['bio'] as String?,
        avatar: json['avatar'] as String?,
        coverImage: json['cover_image'] as String?,
        country: json['country'] as String?,
        island: json['island'] as String?,
      );
}
