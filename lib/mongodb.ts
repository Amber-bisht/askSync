import mongoose from 'mongoose';

// Authenticate against admin database, then use ai2 database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:DcYfwugSPQYxXss1@admin.6ckaw.mongodb.net/test';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: CachedConnection = (global as typeof globalThis & { mongoose?: CachedConnection }).mongoose || { conn: null, promise: null };

if (!cached) {
  cached = ((global as typeof globalThis & { mongoose?: CachedConnection }).mongoose = { conn: null, promise: null } as CachedConnection);
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      dbName: 'ai2' // Switch to ai2 database after authentication
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('Connected to MongoDB successfully');
      if (mongoose.connection.db) {
        console.log('Database:', mongoose.connection.db.databaseName);
      }
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    console.error('MongoDB connection error:', e);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
