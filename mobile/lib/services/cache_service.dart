import 'dart:convert';

import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

import '../models/booking.dart';
import '../models/item.dart';

/// Local read cache backed by sqflite.
///
/// Scope is deliberately narrow, matching the brief: only the
/// last-fetched **catalog list**, **item details**, and **booking history**
/// are cached, purely so those screens have something to render when the
/// network is slow/unavailable. Every write (auth, booking creation,
/// payments) always goes straight through the API — nothing here queues
/// offline writes.
///
/// Storage model: a single generic `cache` table keyed by (kind, key)
/// holding a JSON blob + timestamp, rather than one bespoke table per
/// resource. This keeps the cache dumb-and-simple: it only ever needs to
/// round-trip "the last JSON we got for this thing", never to query across
/// records.
class CacheService {
  CacheService._();
  static final CacheService instance = CacheService._();

  static const _catalogKind = 'catalog_list';
  static const _catalogAllKey = 'all';
  static const _itemKind = 'item_detail';
  static const _bookingsKind = 'bookings_mine';
  static const _bookingsKey = 'mine';

  Database? _db;

  Future<Database> get _database async {
    if (_db != null) return _db!;
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'rental_cache.db');
    _db = await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE cache (
            kind TEXT NOT NULL,
            key TEXT NOT NULL,
            json TEXT NOT NULL,
            cached_at INTEGER NOT NULL,
            PRIMARY KEY (kind, key)
          )
        ''');
      },
    );
    return _db!;
  }

  Future<void> _put(String kind, String key, dynamic jsonValue) async {
    final db = await _database;
    await db.insert(
      'cache',
      {
        'kind': kind,
        'key': key,
        'json': jsonEncode(jsonValue),
        'cached_at': DateTime.now().millisecondsSinceEpoch,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<dynamic> _get(String kind, String key) async {
    final db = await _database;
    final rows = await db.query(
      'cache',
      where: 'kind = ? AND key = ?',
      whereArgs: [kind, key],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    return jsonDecode(rows.first['json'] as String);
  }

  // --- Catalog list -------------------------------------------------------

  Future<void> saveCatalog(List<Item> items) =>
      _put(_catalogKind, _catalogAllKey, items.map((e) => e.toJson()).toList());

  Future<List<Item>> loadCatalog() async {
    final raw = await _get(_catalogKind, _catalogAllKey);
    if (raw == null) return [];
    return (raw as List<dynamic>)
        .map((e) => Item.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // --- Item detail ---------------------------------------------------------

  Future<void> saveItem(Item item) => _put(_itemKind, item.id, item.toJson());

  Future<Item?> loadItem(String id) async {
    final raw = await _get(_itemKind, id);
    if (raw == null) return null;
    return Item.fromJson(raw as Map<String, dynamic>);
  }

  // --- Booking history -------------------------------------------------

  Future<void> saveBookings(List<Booking> bookings) =>
      _put(_bookingsKind, _bookingsKey, bookings.map((e) => e.toJson()).toList());

  Future<List<Booking>> loadBookings() async {
    final raw = await _get(_bookingsKind, _bookingsKey);
    if (raw == null) return [];
    return (raw as List<dynamic>)
        .map((e) => Booking.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Wipes all cached data. Called on logout so the next user who logs in
  /// on this device never sees a flash of the previous user's bookings.
  Future<void> clearAll() async {
    final db = await _database;
    await db.delete('cache');
  }
}
