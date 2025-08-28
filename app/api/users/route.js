import { NextResponse } from 'next/server'
import dbConnect from '../../../lib/mongodb'
import User from '../../../models/User'
import { hashPassword } from '../../../utils/hashPassword'
import { verifyToken, getTokenFromRequest } from '../../../utils/auth'
import { generateUniqueUserCode } from '../../../utils/userCodeGenerator'

export async function GET(request) {
  try {
    await dbConnect()
    
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all')

    if (all && decoded.role === 'admin') {
      const users = await User.find({}).select('-password')
      return NextResponse.json({ users })
    } else {
      const user = await User.findById(decoded.userId).select('-password')
      return NextResponse.json({ user })
    }
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    await dbConnect()
    
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
    }

    const { firstName, lastName, email, password, phone, role } = await request.json()

    if (!firstName || !lastName || !email || !password || !phone) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Check for existing user with same email
    const existingUserByEmail = await User.findOne({ email })
    if (existingUserByEmail) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = hashPassword(password)
    const userCode = await generateUniqueUserCode()
    
    // Double-check userCode uniqueness (additional safety)
    const existingUserByCode = await User.findOne({ userCode })
    if (existingUserByCode) {
      return NextResponse.json(
        { message: 'Generated user code already exists. Please try again.' },
        { status: 400 }
      )
    }
    
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      role: role || 'client',
      userCode
    })

    await user.save()

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        dateOfJoining: user.dateOfJoining,
        userCode: user.userCode
      }
    })
  } catch (error) {
    console.error('Create user error:', error)
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0]
      if (duplicateField === 'email') {
        return NextResponse.json(
          { message: 'User with this email already exists' },
          { status: 400 }
        )
      } else if (duplicateField === 'userCode') {
        return NextResponse.json(
          { message: 'Generated user code already exists. Please try again.' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { message: 'Duplicate entry detected' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    await dbConnect()
    
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
    }

    const { userId, firstName, lastName, email, phone, role } = await request.json()

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 })
    }

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    user.firstName = firstName || user.firstName
    user.lastName = lastName || user.lastName
    user.email = email || user.email
    user.phone = phone || user.phone
    user.role = role || user.role

    await user.save()

    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        dateOfJoining: user.dateOfJoining
      }
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    await dbConnect()
    
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 })
    }

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    await User.findByIdAndDelete(userId)

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}