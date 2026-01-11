import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import getClientPromise from '../../../../lib/mongodb';
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

// GET - Fetch single bench record by ID
export async function GET(request, { params }) {
  try {
    const authResult = await verifyToken(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid bench ID format' }, { status: 400 });
    }

    const client = await getClientPromise();
    const db = client.db('app');
    const collection = db.collection('benchdata');

    const bench = await collection.findOne({ _id: new ObjectId(id) });

    if (!bench) {
      return NextResponse.json({ error: 'Bench record not found' }, { status: 404 });
    }

    const transformedBench = {
      id: bench._id.toString(),
      timestamp: bench.timestamp,
      location: bench.location,
      latitude: bench.latitude,
      longitude: bench.longitude,
      dateLogged: bench.dateLogged,
      loggedBy: bench.loggedBy,
      createdAt: bench.createdAt,
      updatedAt: bench.updatedAt,
      notes: bench.notes,
      tags: bench.tags,
      accuracy: bench.accuracy,
      version: bench.version
    };

    return NextResponse.json({
      success: true,
      data: transformedBench
    });

  } catch (error) {
    console.error('Error fetching bench record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bench record' },
      { status: 500 }
    );
  }
}

// PUT - Update bench record by ID
export async function PUT(request, { params }) {
  try {
    const authResult = await verifyToken(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid bench ID format' }, { status: 400 });
    }

    const body = await request.json();
    const { location, latitude, longitude, notes, tags } = body;

    const client = await getClientPromise();
    const db = client.db('app');
    const collection = db.collection('benchdata');

    // Check if record exists
    const existingBench = await collection.findOne({ _id: new ObjectId(id) });
    if (!existingBench) {
      return NextResponse.json({ error: 'Bench record not found' }, { status: 404 });
    }

    // Prepare update document
    const updateDoc = {
      $set: {
        updatedAt: new Date(),
        version: (existingBench.version || 1) + 1
      }
    };

    // Only update provided fields
    if (location !== undefined) updateDoc.$set.location = location;
    if (latitude !== undefined) updateDoc.$set.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateDoc.$set.longitude = parseFloat(longitude);
    if (notes !== undefined) updateDoc.$set.notes = notes;
    if (tags !== undefined) updateDoc.$set.tags = Array.isArray(tags) ? tags : [];

    // Update the record
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      updateDoc
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'No changes were made to the record' },
        { status: 400 }
      );
    }

    // Fetch and return updated record
    const updatedBench = await collection.findOne({ _id: new ObjectId(id) });
    const transformedBench = {
      id: updatedBench._id.toString(),
      timestamp: updatedBench.timestamp,
      location: updatedBench.location,
      latitude: updatedBench.latitude,
      longitude: updatedBench.longitude,
      dateLogged: updatedBench.dateLogged,
      loggedBy: updatedBench.loggedBy,
      createdAt: updatedBench.createdAt,
      updatedAt: updatedBench.updatedAt
    };

    return NextResponse.json({
      success: true,
      message: 'Bench record updated successfully',
      data: transformedBench
    });

  } catch (error) {
    console.error('Error updating bench record:', error);
    return NextResponse.json(
      { error: 'Failed to update bench record' },
      { status: 500 }
    );
  }
}

// DELETE - Delete bench record by ID
export async function DELETE(request, { params }) {
  try {
    const authResult = await verifyToken(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid bench ID format' }, { status: 400 });
    }

    const client = await getClientPromise();
    const db = client.db('app');
    const collection = db.collection('benchdata');

    // Check if record exists before deletion
    const existingBench = await collection.findOne({ _id: new ObjectId(id) });
    if (!existingBench) {
      return NextResponse.json({ error: 'Bench record not found' }, { status: 404 });
    }

    // Option 1: Soft delete (just mark as inactive)
    // const result = await collection.updateOne(
    //   { _id: new ObjectId(id) },
    //   { 
    //     $set: { 
    //       isActive: false, 
    //       deletedAt: new Date(),
    //       deletedBy: authResult.user.username
    //     } 
    //   }
    // );

    // Option 2: Hard delete (completely remove from database)
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to delete bench record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Bench record deleted successfully',
      deletedId: id
    });

  } catch (error) {
    console.error('Error deleting bench record:', error);
    return NextResponse.json(
      { error: 'Failed to delete bench record' },
      { status: 500 }
    );
  }
}
