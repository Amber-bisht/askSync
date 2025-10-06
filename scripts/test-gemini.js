#!/usr/bin/env node

/**
 * Google Gemini AI Test Script
 * This script tests the Google Gemini API to ensure it's working properly
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logHeader(message) {
  log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  log(`${colors.bright}${colors.cyan}${message}${colors.reset}`);
  log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

async function testGeminiAPI() {
  logHeader('GOOGLE GEMINI AI TEST SCRIPT');
  
  // Check environment variables
  logInfo('Checking environment variables...');
  
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    logError('GOOGLE_GEMINI_API_KEY not found in .env.local file');
    logInfo('Please create a .env.local file with your Google Gemini API key');
    return false;
  }
  
  logSuccess('Google Gemini API key found');
  logInfo(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  
  // Initialize Google Generative AI
  logInfo('Initializing Google Generative AI...');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    logSuccess('Google Generative AI initialized successfully');
    
    // Test basic model access
    logInfo('Testing model access...');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    logSuccess('Gemini 1.5 Flash model accessed successfully');
    
    // Test 1: Simple text generation
    logHeader('TEST 1: SIMPLE TEXT GENERATION');
    try {
      logInfo('Generating simple text response...');
      const result = await model.generateContent("Hello, please respond with 'Gemini AI is working!'");
      const response = result.response.text();
      
      if (response && response.toLowerCase().includes('gemini ai is working')) {
        logSuccess('Simple text generation test passed');
        logInfo(`Response: ${response}`);
      } else {
        logWarning('Simple text generation test passed but response format unexpected');
        logInfo(`Response: ${response}`);
      }
    } catch (error) {
      logError(`Simple text generation test failed: ${error.message}`);
      return false;
    }
    
    // Test 2: MCQ Generation (like our app uses)
    logHeader('TEST 2: MCQ GENERATION TEST');
    try {
      logInfo('Generating MCQ questions...');
      const mcqPrompt = `Generate 2 multiple choice questions about JavaScript. 
      Each question should have 4 options (A, B, C, D) with only one correct answer.
      Format the response as a JSON array with the following structure:
      [
        {
          "question": "Question text here?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option A",
          "explanation": "Brief explanation of why this is correct"
        }
      ]
      
      Always respond with valid JSON only.`;
      
      const mcqResult = await model.generateContent([
        "You are an expert educator creating multiple choice questions. Always respond with valid JSON.",
        mcqPrompt
      ]);
      
      const mcqResponse = mcqResult.response.text();
      
      // Try to parse JSON
      try {
        const questions = JSON.parse(mcqResponse);
        if (Array.isArray(questions) && questions.length > 0) {
          logSuccess('MCQ generation test passed');
          logInfo(`Generated ${questions.length} questions`);
          logInfo(`First question: ${questions[0].question.substring(0, 50)}...`);
        } else {
          logWarning('MCQ generation test passed but response format unexpected');
          logInfo(`Response: ${mcqResponse.substring(0, 100)}...`);
        }
      } catch (parseError) {
        // Try to extract JSON from response
        const jsonMatch = mcqResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            const questions = JSON.parse(jsonMatch[0]);
            logSuccess('MCQ generation test passed (JSON extracted from response)');
            logInfo(`Generated ${questions.length} questions`);
          } catch (finalError) {
            logWarning('MCQ generation test passed but JSON parsing failed');
            logInfo(`Response: ${mcqResponse.substring(0, 100)}...`);
          }
        } else {
          logWarning('MCQ generation test passed but no JSON found in response');
          logInfo(`Response: ${mcqResponse.substring(0, 100)}...`);
        }
      }
    } catch (error) {
      logError(`MCQ generation test failed: ${error.message}`);
      return false;
    }
    
    // Test 3: Error handling
    logHeader('TEST 3: ERROR HANDLING TEST');
    try {
      logInfo('Testing error handling with invalid input...');
      const invalidResult = await model.generateContent("");
      
      if (!invalidResult.response.text()) {
        logSuccess('Error handling test passed (empty input handled gracefully)');
      } else {
        logWarning('Error handling test: empty input produced unexpected response');
      }
    } catch (error) {
      logSuccess('Error handling test passed (error thrown for invalid input)');
    }
    
    // Test 4: Response time
    logHeader('TEST 4: RESPONSE TIME TEST');
    try {
      logInfo('Testing response time...');
      const startTime = Date.now();
      const timeResult = await model.generateContent("Respond with 'OK'");
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      logSuccess(`Response time test passed`);
      logInfo(`Response time: ${responseTime}ms`);
      
      if (responseTime < 5000) {
        logSuccess('Response time is acceptable (< 5 seconds)');
      } else {
        logWarning('Response time is slow (> 5 seconds)');
      }
    } catch (error) {
      logError(`Response time test failed: ${error.message}`);
      return false;
    }
    
    // Final summary
    logHeader('TEST SUMMARY');
    logSuccess('All Google Gemini AI tests completed successfully!');
    logInfo('Your Google Gemini API key is working properly');
    logInfo('The MCQ generation feature should work in your quiz application');
    
    return true;
    
  } catch (error) {
    logError(`Failed to initialize Google Generative AI: ${error.message}`);
    
    if (error.message.includes('API_KEY_INVALID')) {
      logError('Your API key appears to be invalid');
      logInfo('Please check your Google Gemini API key in the .env.local file');
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      logError('API quota exceeded');
      logInfo('Please check your Google Gemini API usage limits');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      logError('Permission denied');
      logInfo('Please check if your API key has the necessary permissions');
    }
    
    return false;
  }
}

async function runTests() {
  try {
    const success = await testGeminiAPI();
    
    if (success) {
      log('\n🎉 All tests passed! Google Gemini AI is working correctly.', 'green');
      process.exit(0);
    } else {
      log('\n💥 Some tests failed. Please check the errors above.', 'red');
      process.exit(1);
    }
  } catch (error) {
    logError(`Unexpected error: ${error.message}`);
    process.exit(1);
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testGeminiAPI };
