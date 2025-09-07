import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '../../../../lib/mongodb'
import User from '../../../../models/User'
import NAV from '../../../../models/NAV'
import Transaction from '../../../../models/Transaction'
import CurrentValue from '../../../../models/CurrentValue'
import { verifyToken, getTokenFromRequest } from '../../../../utils/auth'
import { subtractUnits } from '../../../../utils/unitManager'

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
    
    const { userId, withdrawType, amount, units } = await request.json()

    if (!userId || !withdrawType || (withdrawType !== 'amount' && withdrawType !== 'units')) {
      return NextResponse.json(
        { message: 'User ID and valid withdraw type are required' },
        { status: 400 }
      )
    }

    if (withdrawType === 'amount' && (!amount || amount <= 0)) {
      return NextResponse.json(
        { message: 'Valid amount is required for amount-based withdrawal' },
        { status: 400 }
      )
    }

    if (withdrawType === 'units' && (!units || units <= 0)) {
      return NextResponse.json(
        { message: 'Valid units are required for unit-based withdrawal' },
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

    let withdrawAmount
    let unitsToWithdraw

    if (withdrawType === 'amount') {
      withdrawAmount = amount
      unitsToWithdraw = amount / currentNAV.value
    } else {
      unitsToWithdraw = units
      withdrawAmount = units * currentNAV.value
    }

    // Check if user has sufficient units
    const currentUnits = user.units || 0
    if (unitsToWithdraw > currentUnits) {
      return NextResponse.json(
        { message: 'Insufficient units for withdrawal' },
        { status: 400 }
      )
    }

    // Update user investment data using unitManager
    await subtractUnits(user._id, unitsToWithdraw, withdrawAmount)

    // Update current value by subtracting the withdrawal amount
    await CurrentValue.subtractFromCurrentValue(withdrawAmount, 'withdrawal', `Withdrawal of ${withdrawAmount} processed by admin for user ${user.userCode}`)

    // Fetch updated user data to ensure accurate values
    const updatedUser = await User.findById(userId)

    // Get admin user details for transaction record
    const adminUser = await User.findById(decoded.userId)
    
    // Create transaction record
    const transaction = new Transaction({
      userId: user._id,
      userCode: user.userCode,
      userName: `${user.firstName} ${user.lastName}`,
      amount: withdrawAmount,
      units: unitsToWithdraw,
      navValue: currentNAV.value,
      type: 'withdraw',
      description: `Withdrawal processed by admin`,
      processedBy: decoded.userId,
      processedByName: adminUser ? `${adminUser.firstName} ${adminUser.lastName}` : 'Admin',
      status: 'completed'
    })
    
    await transaction.save()

    return NextResponse.json({ 
      message: 'Money withdrawn successfully',
      user: {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        userCode: updatedUser.userCode,
        dateOfJoining: updatedUser.dateOfJoining,
        investedAmount: updatedUser.investedAmount,
        units: updatedUser.units,
        currentValue: updatedUser.units * currentNAV.value
      },
      transaction: {
        withdrawAmount: withdrawAmount,
        unitsWithdrawn: unitsToWithdraw,
        navValue: currentNAV.value,
        withdrawType: withdrawType,
        date: new Date()
      }
    })
  } catch (error) {
    console.error('Withdraw money error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}