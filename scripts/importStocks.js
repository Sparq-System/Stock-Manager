import xlsx from 'xlsx'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables BEFORE importing database modules
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// Debug: Check if environment variables are loaded
console.log('MONGODB_URI loaded:', process.env.MONGODB_URI ? 'Yes' : 'No')

async function importStocksFromExcel() {
  try {
    // Dynamic import of database modules after environment variables are loaded
    const { default: dbConnect } = await import('../lib/mongodb.js')
    const { default: Stock } = await import('../models/Stock.js')
    
    // Connect to database
    await dbConnect()
    console.log('Connected to MongoDB')

    // Read Excel file
    const excelFilePath = path.join(process.cwd(), 'Stock details.xlsx')
    console.log('Reading Excel file from:', excelFilePath)
    
    const workbook = xlsx.readFile(excelFilePath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Convert to JSON
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 })
    
    // Skip header row and process data
    const stockData = []
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (row && row.length >= 3 && row[0] && row[1] && row[2]) {
        stockData.push({
          serialNumber: parseInt(row[0]),
          stockSymbol: String(row[1]).trim().toUpperCase(),
          companyName: String(row[2]).trim()
        })
      }
    }
    
    console.log(`Found ${stockData.length} stock records to import`)
    
    // Clear existing data
    await Stock.deleteMany({})
    console.log('Cleared existing stock data')
    
    // Insert new data in batches
    const batchSize = 100
    for (let i = 0; i < stockData.length; i += batchSize) {
      const batch = stockData.slice(i, i + batchSize)
      await Stock.insertMany(batch, { ordered: false })
      console.log(`Imported batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(stockData.length/batchSize)}`)
    }
    
    console.log(`Successfully imported ${stockData.length} stocks`)
    
    // Display sample data
    const sampleStocks = await Stock.find().limit(5)
    console.log('Sample imported stocks:')
    sampleStocks.forEach(stock => {
      console.log(`${stock.serialNumber}: ${stock.stockSymbol} - ${stock.companyName}`)
    })
    
  } catch (error) {
    console.error('Error importing stocks:', error)
  } finally {
    process.exit(0)
  }
}

// Run the import
importStocksFromExcel()