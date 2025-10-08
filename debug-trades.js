const mongoose = require('mongoose');
require('./lib/mongodb');
const Trade = require('./models/Trade').default;

async function checkTrades() {
  try {
    console.log('Connecting to database...');
    
    const trades = await Trade.find({}).limit(5);
    console.log(`Found ${trades.length} trades`);
    
    trades.forEach((trade, index) => {
      console.log(`\nTrade ${index + 1}:`);
      console.log('Stock:', trade.stockName);
      console.log('Purchase Date:', trade.purchaseDate);
      console.log('Units Purchased:', trade.unitsPurchased);
      console.log('Selling Date:', trade.sellingDate);
      console.log('Units Sold:', trade.unitsSold);
      console.log('Partial Sales Array:', JSON.stringify(trade.partialSales, null, 2));
      console.log('Status:', trade.status);
      console.log('---');
    });
    
    // Check for trades with partial sales
    const tradesWithPartialSales = await Trade.find({ 
      'partialSales.0': { $exists: true } 
    }).limit(3);
    
    console.log(`\nTrades with partial sales: ${tradesWithPartialSales.length}`);
    tradesWithPartialSales.forEach((trade, index) => {
      console.log(`\nTrade with partial sales ${index + 1}:`);
      console.log('Stock:', trade.stockName);
      console.log('Partial Sales:', JSON.stringify(trade.partialSales, null, 2));
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTrades();