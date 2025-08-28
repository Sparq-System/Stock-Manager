import User from '../models/User.js'

/**
 * Generates a random 6-character code with 3 letters followed by 3 numbers
 * @returns {string} A 6-character code in format ABC123
 */
function generateRandomCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  
  // Generate 3 alphabetic characters
  let result = ''
  for (let i = 0; i < 3; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length))
  }
  
  // Generate 3 numeric characters
  for (let i = 0; i < 3; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }
  
  return result
}

/**
 * Generates a unique 6-character user code that doesn't exist in the database
 * @returns {Promise<string>} A unique 6-character code in format ABC123
 */
/**
 * Validates if a user code follows the correct format
 * @param {string} code - The code to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateUserCode(code) {
  // Check if code is exactly 6 characters: 3 letters followed by 3 numbers
  const regex = /^[A-Z]{3}[0-9]{3}$/
  return regex.test(code)
}

export async function generateUniqueUserCode() {
  let code
  let isUnique = false
  
  while (!isUnique) {
    code = generateRandomCode()
    
    // Check if this code already exists in the database
    const existingUser = await User.findOne({ userCode: code })
    
    if (!existingUser) {
      isUnique = true
    }
  }
  
  return code
}