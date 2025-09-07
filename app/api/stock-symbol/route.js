import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Stock from '../../../models/Stock';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    
    if (!name) {
      return NextResponse.json(
        { error: 'Stock name is required' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // Try to find by exact company name match first
    let stock = await Stock.findOne({ 
      companyName: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    // If not found, try partial match
    if (!stock) {
      stock = await Stock.findOne({ 
        companyName: { $regex: new RegExp(name, 'i') } 
      });
    }
    
    // If still not found, try searching by stock symbol
    if (!stock) {
      stock = await Stock.findOne({ 
        stockSymbol: { $regex: new RegExp(`^${name}$`, 'i') } 
      });
    }
    
    const symbol = stock ? stock.stockSymbol : null;
    
    return NextResponse.json({ symbol });
  } catch (error) {
    console.error('Error fetching stock symbol:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}