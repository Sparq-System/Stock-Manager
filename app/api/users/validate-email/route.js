import { NextResponse } from 'next/server'
import dbConnect from '../../../../lib/mongodb'
import User from '../../../../models/User'
import { verifyToken, getTokenFromRequest } from '../../../../utils/auth'

/**
 * Validates if an email address is available (not already in use)
 * Optimized for large databases with proper indexing
 */
export async function POST(request) {
  try {
    await dbConnect()
    
    // Verify admin authentication
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
    }

    const { email, excludeUserId } = await request.json()

    // Validate email format
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { message: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Normalize email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim()

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { 
          isAvailable: false, 
          message: 'Invalid email format' 
        },
        { status: 200 }
      )
    }

    // Build query - exclude current user if editing
    const query = { email: normalizedEmail }
    if (excludeUserId) {
      query._id = { $ne: excludeUserId }
    }

    // Use lean() for faster queries and select only _id field
    // This leverages the email index for O(log n) lookup time
    const existingUser = await User.findOne(query, '_id').lean()

    const isAvailable = !existingUser

    return NextResponse.json({
      isAvailable,
      message: isAvailable 
        ? 'Email is available' 
        : 'User with this email already exists'
    })

  } catch (error) {
    console.error('Email validation error:', error)
    return NextResponse.json(
      { 
        isAvailable: false,
        message: 'Validation service temporarily unavailable' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET method for health check
 */
export async function GET() {
  return NextResponse.json({
    service: 'Email Validation API',
    status: 'active',
    timestamp: new Date().toISOString()
  })
}