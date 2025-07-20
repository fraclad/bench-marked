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

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('app');
    const usersCollection = db.collection('users');

    // Find user in database
    const user = await usersCollection.findOne({ username: username });

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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 