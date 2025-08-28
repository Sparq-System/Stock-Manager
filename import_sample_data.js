// MongoDB Import Script for Sample Data
// Run this script using: node import_sample_data.js

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB connection URI from your .env.local
const MONGODB_URI = 'mongodb+srv://mishra07adi:5NTEUYtJivhMqVIA@stock-portfolio-cluster.nlgr7ht.mongodb.net/';
const DATABASE_NAME = 'stock_portfolio_db'; // You can change this to your preferred database name

async function importSampleData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);
    
    // Read sample data
    const sampleDataPath = path.join(__dirname, 'sample_data.json');
    const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));
    
    // Note: Database clearing has been disabled to preserve existing data
    // If you need to clear data, uncomment the lines below:
    // await db.collection('users').deleteMany({});
    // await db.collection('trades').deleteMany({});
    // await db.collection('navs').deleteMany({});
    
    // Import Users
    console.log('Importing users...');
    const usersResult = await db.collection('users').insertMany(sampleData.users);
    console.log(`Inserted ${usersResult.insertedCount} users`);
    
    // Import Trades
    console.log('Importing trades...');
    const tradesResult = await db.collection('trades').insertMany(sampleData.trades);
    console.log(`Inserted ${tradesResult.insertedCount} trades`);
    
    // Import NAVs
    console.log('Importing NAVs...');
    const navsResult = await db.collection('navs').insertMany(sampleData.navs);
    console.log(`Inserted ${navsResult.insertedCount} NAV records`);
    
    console.log('\n✅ Sample data imported successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${usersResult.insertedCount}`);
    console.log(`- Trades: ${tradesResult.insertedCount}`);
    console.log(`- NAV Records: ${navsResult.insertedCount}`);
    
  } catch (error) {
    console.error('Error importing sample data:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the import
importSampleData();