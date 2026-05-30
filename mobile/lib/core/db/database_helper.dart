import 'dart:async';
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';
import '../models/user_profile.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('rurubene.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  Future _createDB(Database db, int version) async {
    const idType = 'INTEGER PRIMARY KEY AUTOINCREMENT';
    const textType = 'TEXT';
    const integerType = 'INTEGER';

    await db.execute('''
      CREATE TABLE profiles (
        id $idType,
        user_id $integerType UNIQUE,
        name $textType,
        email $textType,
        role $textType,
        language $textType,
        dark_mode $integerType,
        bio $textType,
        avatar $textType,
        cover_image $textType,
        country $textType,
        island $textType
      )
    ''');
  }

  Future<UserProfile> createProfile(UserProfile profile) async {
    final db = await instance.database;
    final id = await db.insert('profiles', profile.toJson(), conflictAlgorithm: ConflictAlgorithm.replace);
    return profile.copyWith(id: id);
  }

  Future<UserProfile?> readProfile(int userId) async {
    final db = await instance.database;
    final maps = await db.query(
      'profiles',
      columns: null,
      where: 'user_id = ?',
      whereArgs: [userId],
    );

    if (maps.isNotEmpty) {
      return UserProfile.fromJson(maps.first);
    } else {
      return null;
    }
  }

  Future<int> updateProfile(UserProfile profile) async {
    final db = await instance.database;
    return db.update(
      'profiles',
      profile.toJson(),
      where: 'id = ?',
      whereArgs: [profile.id],
    );
  }

  Future<int> deleteProfile(int id) async {
    final db = await instance.database;
    return await db.delete(
      'profiles',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<void> close() async {
    final db = await instance.database;
    db.close();
  }
}
