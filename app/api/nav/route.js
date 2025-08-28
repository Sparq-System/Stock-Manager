import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '../../../lib/mongodb'
import NAV from '../../../models/NAV'
import { verifyToken, getTokenFromRequest } from '../../../utils/auth'

export async function GET(request) {
  try {
    await dbConnect()
    
    const navs = await NAV.find({})
      .populate('updatedBy', 'firstName lastName')
      .sort({ date: -1 })
      .limit(30)

    return NextResponse.json({ navs })
  } catch (error) {
    console.error('Get NAV error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    
    const { date, value, updatedBy } = await request.json()

    if (!date || !value) {
      return NextResponse.json(
        { message: 'Date and value are required' },
        { status: 400 }
      )
    }

    const navDate = new Date(date)
    const existingNAV = await NAV.findOne({ date: navDate })

    if (existingNAV) {
      // Update existing NAV
      existingNAV.value = value
      existingNAV.updatedBy = new mongoose.Types.ObjectId(decoded.userId)
      await existingNAV.save()
      
      return NextResponse.json({ 
        message: 'NAV updated successfully',
        nav: existingNAV 
      })
    } else {
      // Create new NAV
      const newNAV = new NAV({
        date: navDate,
        value,
        updatedBy: new mongoose.Types.ObjectId(decoded.userId)
      })
      
      await newNAV.save()
      
      return NextResponse.json({ 
        message: 'NAV created successfully',
        nav: newNAV 
      })
    }
  } catch (error) {
    console.error('Create/Update NAV error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const navId = searchParams.get('navId')
    
    console.log('Delete request received for navId:', navId)

    if (!navId) {
      console.log('No navId provided')
      return NextResponse.json({ message: 'NAV ID is required' }, { status: 400 })
    }

    const nav = await NAV.findById(navId)
    console.log('Found NAV record:', nav)
    
    if (!nav) {
      console.log('NAV not found for ID:', navId)
      return NextResponse.json({ message: 'NAV not found' }, { status: 404 })
    }

    const deletedNav = await NAV.findByIdAndDelete(navId)
    console.log('NAV deleted successfully:', deletedNav)

    return NextResponse.json({ message: 'NAV deleted successfully' })
  } catch (error) {
    console.error('Delete NAV error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error.message}` },
      { status: 500 }
    )
  }
}