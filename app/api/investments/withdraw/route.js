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

    // Calculate proportional invested amount to reduce
    // const proportionWithdrawn = unitsToWithdraw / currentUnits
    // const investedAmountToReduce = (user.investedAmount || 0) * proportionWithdrawn
    user.investedAmount = Math.max(0, user.investedAmount - withdrawAmount)
    user.units = Math.max(0, currentUnits - unitsToWithdraw)

    // Update user investment data
    // user.investedAmount = Math.max(0, (user.investedAmount || 0) - investedAmountToReduce)
    // user.units = Math.max(0, currentUnits - unitsToWithdraw)
    // currentValue is now calculated dynamically: units * NAV
    
    await user.save()

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
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        investedAmount: user.investedAmount,
        units: user.units,
        currentValue: user.units * currentNAV.value // Calculate dynamically
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