import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set. Check your .env file.');
}


let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (db) return db;

  try {
    client = new MongoClient(String(MONGODB_URI));
    await client.connect();
    db = client.db(); // Uses the database name from the URI
    console.log('✅ Connected to MongoDB Atlas');

    // Create indexes for performance
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('game_progress').createIndex({ userId: 1, gameId: 1 }, { unique: true });
    await db.collection('game_sessions').createIndex({ userId: 1, gameId: 1 });
    await db.collection('game_sessions').createIndex({ userId: 1, startedAt: -1 });
    await db.collection('notifications').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('adaptive_profiles').createIndex({ userId: 1, gameId: 1 }, { unique: true });

    return db;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error; // Throwing ensures TS knows the function won't return undefined
  }
}

export function getDb(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDatabase() first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('🔌 MongoDB connection closed');
  }
}
