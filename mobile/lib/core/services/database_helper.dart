import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

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
    await db.execute('''
      CREATE TABLE tracks (
        id INTEGER PRIMARY KEY,
        title TEXT,
        artist_name TEXT,
        cover_url TEXT,
        stream_url TEXT,
        duration INTEGER,
        is_premium INTEGER,
        price TEXT,
        is_purchased INTEGER
      )
    ''');

    await db.execute('''
      CREATE TABLE products (
        id INTEGER PRIMARY KEY,
        name TEXT,
        description TEXT,
        price TEXT,
        image_url TEXT,
        category TEXT,
        artist_name TEXT
      )
    ''');
    
    await db.execute('''
      CREATE TABLE wallet (
        id INTEGER PRIMARY KEY,
        balance TEXT
      )
    ''');
  }
  
  Future<void> clearAll() async {
    final db = await instance.database;
    await db.delete('tracks');
    await db.delete('products');
    await db.delete('wallet');
  }
}
