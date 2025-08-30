import { NextResponse } from 'next/server'
import dbConnect from '../../../../../lib/mongodb'
import User from '../../../../../models/User'
import Transaction from '../../../../../models/Transaction'
import { verifyToken, getTokenFromRequest } from '../../../../../utils/auth'

export async function POST(request, { params }) {
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

    const { id } = params
    const { type, amount, units } = await request.json()

    if (!type || !amount || amount <= 0) {
      return NextResponse.json({ message: 'Invalid request data' }, { status: 400 })
    }

    if (!['add', 'withdraw'].includes(type)) {
      return NextResponse.json({ message: 'Invalid transaction type' }, { status: 400 })
    }

    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const amountValue = parseFloat(amount)
    const unitsValue = parseFloat(units) || 0

    let updateData = {
      updatedAt: new Date()
    }

    if (type === 'add') {
      updateData.investedAmount = user.investedAmount + amountValue
      updateData.units = user.units + unitsValue
      updateData.currentValue = user.currentValue + amountValue // For now, current value equals invested amount
    } else { // withdraw
      if (user.investedAmount < amountValue) {
        return NextResponse.json({ message: 'Insufficient invested amount' }, { status: 400 })
      }
      if (unitsValue > 0 && user.units < unitsValue) {
        return NextResponse.json({ message: 'Insufficient units' }, { status: 400 })
      }

      updateData.investedAmount = Math.max(0, user.investedAmount - amountValue)
      updateData.units = Math.max(0, user.units - unitsValue)
      // currentValue is now calculated dynamically as units * NAV
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, select: '-password' }
    )

    // Get admin user details for transaction record
    const adminUser = await User.findById(decoded.userId)
    
    // Create transaction record
    const transaction = new Transaction({
      userId: user._id,
      userCode: user.userCode,
      userName: user.name,
      amount: amountValue,
      units: unitsValue,
      navValue: 0, // NAV value not available in this context
      type: type === 'add' ? 'invest' : 'withdraw',
      description: `${type === 'add' ? 'Investment' : 'Withdrawal'} processed by admin`,
      processedBy: decoded.userId,
      processedByName: adminUser ? adminUser.name : 'Admin',
      status: 'completed'
    })
    
    await transaction.save()

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user investment:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}