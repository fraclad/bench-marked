import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import jwt from 'jsonwebtoken';

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB with detailed error handling
    let client;
    try {
      client = await clientPromise;
      console.log('MongoDB connection successful');
    } catch (connectionError) {
      console.error('MongoDB connection failed:', connectionError);
      return NextResponse.json(
        { error: 'Database connection failed. Please check MongoDB configuration.' },
        { status: 503 }
      );
    }

    const db = client.db('app');
    const usersCollection = db.collection('users');

    // Check if users collection exists and has documents
    let user;
    try {
      user = await usersCollection.findOne({ username: username });
      console.log('Database query successful, user found:', !!user);
    } catch (queryError) {
      console.error('Database query failed:', queryError);
      return NextResponse.json(
        { error: 'Database query failed. Please check database configuration.' },
        { status: 503 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check password (direct comparison since they're stored as plain text in your DB)
    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Create JWT token with 30 minutes expiration
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        exp: Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutes
      },
      JWT_SECRET
    );

    return NextResponse.json({
      success: true,
      token,
      username: user.username,
      expiresIn: 30 * 60 * 1000 // 30 minutes in milliseconds
    });

  } catch (error) {
    console.error('Login error details:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Provide more specific error messages based on error type
    if (error.name === 'MongoNetworkError') {
      return NextResponse.json(
        { error: 'Cannot connect to database. Check network and MongoDB configuration.' },
        { status: 503 }
      );
    } else if (error.name === 'MongoServerSelectionError') {
      return NextResponse.json(
        { error: 'Database server not reachable. Check MongoDB cluster status.' },
        { status: 503 }
      );
    } else if (error.name === 'MongoParseError') {
      return NextResponse.json(
        { error: 'Invalid database connection string format.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 