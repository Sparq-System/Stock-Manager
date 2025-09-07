const XLSX = require('xlsx');
const path = require('path');

// Path to the Excel file
const excelFilePath = path.join(__dirname, '..', 'Stock details.xlsx');

try {
    // Read the Excel file
    const workbook = XLSX.readFile(excelFilePath);
    
    // Get the first sheet name
    const sheetName = workbook.SheetNames[0];
    console.log('Sheet name:', sheetName);
    
    // Get the worksheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON to see the structure
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('\n=== Excel File Structure ===');
    console.log('Total rows:', jsonData.length);
    
    if (jsonData.length > 0) {
        console.log('\nColumn headers (first row):');
        console.log(jsonData[0]);
        
        console.log('\nFirst few data rows:');
        for (let i = 1; i < Math.min(6, jsonData.length); i++) {
            console.log(`Row ${i}:`, jsonData[i]);
        }
        
        // Try to identify columns that might contain stock symbol, name, and image
        const headers = jsonData[0];
        console.log('\n=== Column Analysis ===');
        headers.forEach((header, index) => {
            if (header) {
                const headerLower = header.toString().toLowerCase();
                let possibleContent = '';
                
                if (headerLower.includes('symbol') || headerLower.includes('ticker')) {
                    possibleContent = ' (Likely STOCK SYMBOL)';
                } else if (headerLower.includes('name') || headerLower.includes('company')) {
                    possibleContent = ' (Likely STOCK NAME)';
                } else if (headerLower.includes('image') || headerLower.includes('logo') || headerLower.includes('url')) {
                    possibleContent = ' (Likely STOCK IMAGE)';
                }
                
                console.log(`Column ${index}: "${header}"${possibleContent}`);
            }
        });
    }
    
} catch (error) {
    console.error('Error reading Excel file:', error.message);
    console.log('\nMake sure the xlsx package is installed:');
    console.log('npm install xlsx');
}