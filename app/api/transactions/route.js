import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb'
import Transaction from '../../../models/Transaction'
import User from '../../../models/User'
import { verifyToken } from '../../../utils/auth'

// GET - Fetch transactions with search and filter
export async function GET(request) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    // Build search query
    let query = {}
    
    // Search functionality
    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { userCode: { $regex: search, $options: 'i' } },
        { processedByName: { $regex: search, $options: 'i' } }
      ]
      
      // If search is a number, also search by amount
      if (!isNaN(search)) {
        query.$or.push({ amount: parseFloat(search) })
      }
    }
    
    // Filter by type
    if (type && ['invest', 'withdraw'].includes(type)) {
      query.type = type
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) {
        query.createdAt.$gte = new Date(startDate)
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z')
      }
    }
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit
    
    // Sort options
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1
    
    // Execute query with pagination
    const [transactions, totalCount] = await Promise.all([
      Transaction.find(query)
        .populate('userId', 'firstName lastName email userCode')
        .populate('processedBy', 'firstName lastName email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(query)
    ])
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1
    
    return NextResponse.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit
        }
      }
    })
    
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

// POST - Create new transaction
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    await connectDB()
    
    const body = await request.json()
    const { userId, amount, type, units = 0, navValue = 0, description = '' } = body
    
    // Validate required fields
    if (!userId || !amount || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, amount, type' },
        { status: 400 }
      )
    }
    
    // Validate type
    if (!['invest', 'withdraw'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction type. Must be invest or withdraw' },
        { status: 400 }
      )
    }
    
    // Get user details
    const user = await User.findById(userId).lean()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Get processed by user details
    const processedByUser = await User.findById(decoded.userId).lean()
    if (!processedByUser) {
      return NextResponse.json(
        { success: false, error: 'Processed by user not found' },
        { status: 404 }
      )
    }
    
    // Create transaction
    const transaction = new Transaction({
      userId,
      userCode: user.userCode,
      userName: `${user.firstName} ${user.lastName}`,
      amount: parseFloat(amount),
      units: parseFloat(units),
      navValue: parseFloat(navValue),
      type,
      description,
      processedBy: decoded.userId,
      processedByName: `${processedByUser.firstName} ${processedByUser.lastName}`,
      status: 'completed'
    })
    
    await transaction.save()
    
    // Populate the saved transaction for response
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('userId', 'firstName lastName email userCode')
      .populate('processedBy', 'firstName lastName email')
      .lean()
    
    return NextResponse.json({
      success: true,
      data: populatedTransaction,
      message: 'Transaction created successfully'
    })
    
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}