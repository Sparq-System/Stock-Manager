const XLSX = require('xlsx');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Import the Stock model (using dynamic import for ES6 modules)
let Stock;

// Path to the Excel file
const excelFilePath = path.join(__dirname, '..', 'Stock details.xlsx');

async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

async function importStocksFromExcel() {
    try {
        console.log('Reading Excel file...');
        
        // Read the Excel file
        const workbook = XLSX.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log(`Found ${jsonData.length - 1} stock records to process`);
        
        // Skip header row and process data
        const stockData = jsonData.slice(1);
        
        let processed = 0;
        let updated = 0;
        let created = 0;
        let errors = 0;
        
        for (const row of stockData) {
            try {
                const [rank, symbol, companyName, imageUrl] = row;
                
                // Skip rows with missing essential data
                if (!symbol || !companyName) {
                    console.log(`Skipping row with missing data: ${JSON.stringify(row)}`);
                    continue;
                }
                
                // Clean the symbol (remove any extra spaces)
                const cleanSymbol = symbol.toString().trim();
                const cleanCompanyName = companyName.toString().trim();
                const cleanImageUrl = imageUrl ? imageUrl.toString().trim() : null;
                
                // Check if stock already exists
                const existingStock = await Stock.findOne({ stockSymbol: cleanSymbol });
                
                if (existingStock) {
                    // Update existing stock with new data
                    const updateData = {
                        companyName: cleanCompanyName,
                        image: cleanImageUrl
                    };
                    
                    await Stock.findOneAndUpdate(
                        { stockSymbol: cleanSymbol },
                        updateData,
                        { new: true }
                    );
                    
                    updated++;
                    console.log(`Updated: ${cleanSymbol} - ${cleanCompanyName}`);
                } else {
                    // Create new stock entry
                    const newStock = new Stock({
                        stockSymbol: cleanSymbol,
                        companyName: cleanCompanyName,
                        image: cleanImageUrl
                    });
                    
                    await newStock.save();
                    created++;
                    console.log(`Created: ${cleanSymbol} - ${cleanCompanyName}`);
                }
                
                processed++;
                
                // Log progress every 100 records
                if (processed % 100 === 0) {
                    console.log(`Progress: ${processed}/${stockData.length} records processed`);
                }
                
            } catch (error) {
                errors++;
                console.error(`Error processing row ${processed + 1}:`, error.message);
                console.error('Row data:', row);
            }
        }
        
        console.log('\n=== Import Summary ===');
        console.log(`Total records processed: ${processed}`);
        console.log(`Records created: ${created}`);
        console.log(`Records updated: ${updated}`);
        console.log(`Errors: ${errors}`);
        
    } catch (error) {
        console.error('Error importing stocks:', error);
    }
}

async function main() {
    console.log('Starting stock import process...');
    
    // Dynamic import of ES6 Stock model
    const { default: StockModel } = await import('../models/Stock.js');
    Stock = StockModel;
    
    await connectToDatabase();
    await importStocksFromExcel();
    
    console.log('Import process completed. Closing database connection...');
    await mongoose.connection.close();
    process.exit(0);
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT. Closing database connection...');
    await mongoose.connection.close();
    process.exit(0);
});

// Run the import
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});