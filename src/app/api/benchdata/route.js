import { NextResponse } from 'next/server';
import getClientPromise from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';

// Verify JWT token and extract user info
async function verifyToken(request) {
  const JWT_SECRET = process.env.JWT_SECRET;
  
  if (!JWT_SECRET) {
    console.error('JWT_SECRET environment variable is not set');
    return { error: 'Server configuration error', status: 500 };
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid authorization header', status: 401 };
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { user: decoded };
  } catch (error) {
    return { error: 'Invalid or expired token', status: 401 };
  }
}

// GET - Fetch all bench records for authenticated user
export async function GET(request) {
  try {
    const authResult = await verifyToken(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const client = await getClientPromise();
    const db = client.db('app');
    const collection = db.collection('benchdata');

    // Get all bench records, sorted by creation date (newest first)
    const benches = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Transform MongoDB documents to frontend format
    const transformedBenches = benches.map(doc => ({
      id: doc._id.toString(),
      timestamp: doc.timestamp,
      location: doc.location,
      latitude: doc.latitude,
      longitude: doc.longitude,
      dateLogged: doc.dateLogged,
      loggedBy: doc.loggedBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));

    return NextResponse.json({
      success: true,
      benches: transformedBenches,
      count: transformedBenches.length
    });

  } catch (error) {
    console.error('Error fetching bench data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bench data' },
      { status: 500 }
    );
  }
}

// POST - Create new bench record (admin only)
export async function POST(request) {
  try {
    const authResult = await verifyToken(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Check if user has admin role
    if (authResult.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { timestamp, location, latitude, longitude } = body;

    // Validate required fields
    if (!timestamp || !location || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: timestamp, location, latitude, longitude' },
        { status: 400 }
      );
    }

    const client = await getClientPromise();
    const db = client.db('app');
    const collection = db.collection('benchdata');

    // Create bench document with comprehensive schema
    const benchDoc = {
      // Core tracking data
      timestamp: timestamp, // Formatted display string (e.g. "2025-01-19 5:30 PM CT")
      location: location,   // Human-readable location name
      latitude: parseFloat(latitude),   // GPS coordinate (North/South)
      longitude: parseFloat(longitude), // GPS coordinate (East/West)
      
      // User and session info
      loggedBy: authResult.user.username,
      userId: authResult.user.userId,
      
      // Date handling
      dateLogged: new Date(timestamp.replace(' CT', '')), // Parsed date for queries
      
      // MongoDB timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Additional metadata
      sessionInfo: {
        userAgent: request.headers.get('user-agent') || 'Unknown',
        ipAddress: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 'Unknown'
      },
      
      // Geolocation accuracy (if provided)
      accuracy: body.accuracy || null,
      
      // Optional fields for future features
      notes: body.notes || '',
      tags: body.tags || [],
      photos: body.photos || [],
      
      // Status and flags
      isActive: true,
      isPublic: body.isPublic || false,
      
      // Version for optimistic locking
      version: 1
    };

    const result = await collection.insertOne(benchDoc);

    // Return created document
    const createdDoc = await collection.findOne({ _id: result.insertedId });
    const transformedDoc = {
      id: createdDoc._id.toString(),
      timestamp: createdDoc.timestamp,
      location: createdDoc.location,
      latitude: createdDoc.latitude,
      longitude: createdDoc.longitude,
      dateLogged: createdDoc.dateLogged,
      loggedBy: createdDoc.loggedBy,
      createdAt: createdDoc.createdAt,
      updatedAt: createdDoc.updatedAt
    };

    return NextResponse.json({
      success: true,
      message: 'Bench record created successfully',
      data: transformedDoc
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating bench record:', error);
    return NextResponse.json(
      { error: 'Failed to create bench record' },
      { status: 500 }
    );
  }
}
