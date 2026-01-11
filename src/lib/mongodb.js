import { MongoClient } from 'mongodb';

let client;
let clientPromise;

function getClientPromise() {
  // Get MongoDB URI from environment variables
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('Please add your MongoDB URI to the environment variables (MONGODB_URI)');
  }

  if (clientPromise) {
    return clientPromise;
  }

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so the MongoClient isn't repeatedly instantiated
    if (!global._mongoClientPromise) {
      client = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      });
      global._mongoClientPromise = client.connect().catch((error) => {
        console.error('MongoDB connection error (development):', error);
        throw error;
      });
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production mode, create a new MongoClient instance
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    clientPromise = client.connect().catch((error) => {
      console.error('MongoDB connection error (production):', error);
      console.error('MongoDB URI format check:', MONGODB_URI ? 'URI exists' : 'URI missing');
      throw error;
    });
  }

  return clientPromise;
}

export default getClientPromise;
