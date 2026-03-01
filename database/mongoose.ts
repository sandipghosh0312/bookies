import mongoose from "mongoose";

declare global {
    var mongooseCache: {
        conn: typeof mongoose | null
        promise: Promise<typeof mongoose> | null
    }
}

let cached = global.mongooseCache || (global.mongooseCache = { conn: null, promise: null });

export const connectToDatabase = async () => {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined. Please set the MONGODB_URI environment variable.");
    }
    
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
        })
    }

    try {
        cached.conn = await cached.promise;
        
    } catch (e) {
        cached.promise = null;
        console.error("Could not connect to database", e);
        throw e;
    }

    console.log("Connected to database");
    return cached.conn;
}