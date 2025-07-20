import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Check if token is expired (though jwt.verify should handle this)
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTime) {
        return NextResponse.json(
          { error: 'Token expired', expired: true },
          { status: 401 }
        );
      }

      // Token is valid
      return NextResponse.json({
        valid: true,
        username: decoded.username,
        userId: decoded.userId,
        expiresAt: decoded.exp * 1000 // Convert to milliseconds
      });

    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return NextResponse.json(
          { error: 'Token expired', expired: true },
          { status: 401 }
        );
      } else if (jwtError.name === 'JsonWebTokenError') {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      } else {
        throw jwtError;
      }
    }

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 