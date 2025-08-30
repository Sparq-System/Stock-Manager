import { NextResponse } from 'next/server'
import dbConnect from '../../../../lib/mongodb'
import User from '../../../../models/User'
import { verifyToken, getTokenFromRequest } from '../../../../utils/auth'

export async function PATCH(request) {
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

    const { userId, action, amount, units } = await request.json()

    if (!userId || !action || amount === undefined) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    if (!['add', 'withdraw'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action. Use "add" or "withdraw"' }, { status: 400 })
    }

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const amountValue = parseFloat(amount)
    const unitsValue = parseFloat(units) || 0

    if (isNaN(amountValue) || amountValue <= 0) {
      return NextResponse.json({ message: 'Invalid amount' }, { status: 400 })
    }

    let updatedUser
    if (action === 'add') {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $inc: {
            investedAmount: amountValue,
            units: unitsValue
          },
          $set: {
            currentValue: user.investedAmount + amountValue, // For now, current value equals invested amount
            updatedAt: new Date()
          }
        },
        { new: true, select: '-password' }
      )
    } else { // withdraw
      if (user.investedAmount < amountValue) {
        return NextResponse.json({ message: 'Insufficient invested amount' }, { status: 400 })
      }
      if (user.units < unitsValue) {
        return NextResponse.json({ message: 'Insufficient units' }, { status: 400 })
      }

      updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $inc: {
            investedAmount: -amountValue,
            units: -unitsValue
          },
          $set: {
            currentValue: Math.max(0, user.investedAmount - amountValue),
            updatedAt: new Date()
          }
        },
        { new: true, select: '-password' }
      )
    }

    return NextResponse.json({
      message: `Successfully ${action === 'add' ? 'added money to' : 'withdrew money from'} user account`,
      user: updatedUser
    })
  } catch (error) {
    console.error('Error updating user investments:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}