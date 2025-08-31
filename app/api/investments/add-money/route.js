import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '../../../../lib/mongodb'
import User from '../../../../models/User'
import NAV from '../../../../models/NAV'
import Transaction from '../../../../models/Transaction'
import { verifyToken, getTokenFromRequest } from '../../../../utils/auth'

export async function POST(request) {
  try {
    await dbConnect()
    
    // Verify authentication
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    
    const { userId, amount } = await request.json()

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { message: 'User ID and valid amount are required' },
        { status: 400 }
      )
    }

    // Get current NAV value
    const currentNAV = await NAV.findOne({}).sort({ date: -1 })
    if (!currentNAV) {
      return NextResponse.json(
        { message: 'No NAV data available' },
        { status: 400 }
      )
    }

    // Find the user
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate units to add based on current NAV
    const unitsToAdd = amount / currentNAV.value
    
    // Update user investment data
    user.investedAmount = (user.investedAmount || 0) + amount
    user.units = (user.units || 0) + unitsToAdd
    // currentValue is now calculated dynamically: units * NAV
    
    await user.save()

    // Get admin user details for transaction record
    const adminUser = await User.findById(decoded.userId)
    
    // Create transaction record
    const transaction = new Transaction({
      userId: user._id,
      userCode: user.userCode,
      userName: `${user.firstName} ${user.lastName}`,
      amount: amount,
      units: unitsToAdd,
      navValue: currentNAV.value,
      type: 'invest',
      description: `Investment added by admin`,
      processedBy: decoded.userId,
      processedByName: adminUser ? `${adminUser.firstName} ${adminUser.lastName}` : 'Admin',
      status: 'completed'
    })
    
    await transaction.save()

    return NextResponse.json({ 
      message: 'Money added successfully',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        investedAmount: user.investedAmount,
        units: user.units,
        currentValue: user.units * currentNAV.value // Calculate dynamically
      },
      transaction: {
        amount: amount,
        unitsAdded: unitsToAdd,
        navValue: currentNAV.value,
        date: new Date()
      }
    })
  } catch (error) {
    console.error('Add money error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}