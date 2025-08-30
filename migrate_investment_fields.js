// Migration script to add investment fields to existing users
// Run this script using: node migrate_investment_fields.js

const { MongoClient } = require('mongodb');

// MongoDB connection URI - update this with your actual connection string
const MONGODB_URI = 'mongodb+srv://mishra07adi:5NTEUYtJivhMqVIA@stock-portfolio-cluster.nlgr7ht.mongodb.net/';
const DATABASE_NAME = 'stock_portfolio_db';

async function migrateInvestmentFields() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');
    
    // Find users that don't have investment fields
    const usersWithoutInvestmentFields = await usersCollection.find({
      $or: [
        { investedAmount: { $exists: false } },
        { units: { $exists: false } },
        { currentValue: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`Found ${usersWithoutInvestmentFields.length} users without investment fields`);
    
    if (usersWithoutInvestmentFields.length === 0) {
      console.log('All users already have investment fields. No migration needed.');
      return;
    }
    
    // Update users to add missing investment fields
    const result = await usersCollection.updateMany(
      {
        $or: [
          { investedAmount: { $exists: false } },
          { units: { $exists: false } },
          { currentValue: { $exists: false } }
        ]
      },
      {
        $set: {
          investedAmount: 0,
          units: 0,
          currentValue: 0,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`\n✅ Migration completed successfully!`);
    console.log(`Updated ${result.modifiedCount} users with investment fields`);
    
    // Verify the migration
    const totalUsers = await usersCollection.countDocuments({});
    const usersWithInvestmentFields = await usersCollection.countDocuments({
      investedAmount: { $exists: true },
      units: { $exists: true },
      currentValue: { $exists: true }
    });
    
    console.log(`\n📊 Verification:`);
    console.log(`- Total users: ${totalUsers}`);
    console.log(`- Users with investment fields: ${usersWithInvestmentFields}`);
    
    if (totalUsers === usersWithInvestmentFields) {
      console.log('✅ All users now have investment fields!');
    } else {
      console.log('⚠️  Some users may still be missing investment fields');
    }
    
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the migration
migrateInvestmentFields();