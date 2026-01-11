import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  // Get JWT secret from environment variables (checked at runtime, not build time)
  const JWT_SECRET = process.env.JWT_SECRET;
  
  if (!JWT_SECRET) {
    console.error('JWT_SECRET environment variable is not set');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

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
      console.error('JWT verification error:', jwtError);
      
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