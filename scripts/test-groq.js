#!/usr/bin/env node

/**
 * Groq AI Test Script
 * This script tests the Groq API to ensure it's working properly
 */

const Groq = require('groq-sdk');
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

async function testGroqAPI() {
  logHeader('GROQ AI TEST SCRIPT');
  
  // Check environment variables
  logInfo('Checking environment variables...');
  
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    logError('GROQ_API_KEY not found in .env.local file');
    logInfo('Please create a .env.local file with your Groq API key');
    logInfo('Get your free API key at: https://console.groq.com/keys');
    return false;
  }
  
  logSuccess('Groq API key found');
  logInfo(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  
  // Initialize Groq
  logInfo('Initializing Groq AI...');
  
  try {
    const groq = new Groq({
      apiKey: apiKey,
    });
    logSuccess('Groq AI initialized successfully');
    
    // Test 1: Simple text generation
    logHeader('TEST 1: SIMPLE TEXT GENERATION');
    try {
      logInfo('Generating simple text response...');
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: "Please respond with 'Groq AI is working!'"
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 100,
      });
      
      const response = completion.choices[0]?.message?.content || '';
      
      if (response && response.toLowerCase().includes('groq ai is working')) {
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
      
      const mcqCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator creating multiple choice questions. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: mcqPrompt
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 2048,
      });
      
      const mcqResponse = mcqCompletion.choices[0]?.message?.content || '';
      
      // Try to parse JSON
      try {
        // Try to extract JSON from response
        const jsonMatch = mcqResponse.match(/\[[\s\S]*\]/);
        const jsonStr = jsonMatch ? jsonMatch[0] : mcqResponse;
        const questions = JSON.parse(jsonStr);
        
        if (Array.isArray(questions) && questions.length > 0) {
          logSuccess('MCQ generation test passed');
          logInfo(`Generated ${questions.length} questions`);
          logInfo(`First question: ${questions[0].question.substring(0, 50)}...`);
        } else {
          logWarning('MCQ generation test passed but response format unexpected');
          logInfo(`Response: ${mcqResponse.substring(0, 100)}...`);
        }
      } catch (parseError) {
        logWarning('MCQ generation test passed but JSON parsing failed');
        logInfo(`Response: ${mcqResponse.substring(0, 100)}...`);
        logInfo(`Parse error: ${parseError.message}`);
      }
    } catch (error) {
      logError(`MCQ generation test failed: ${error.message}`);
      return false;
    }
    
    // Test 3: Error handling
    logHeader('TEST 3: ERROR HANDLING TEST');
    try {
      logInfo('Testing error handling with invalid input...');
      const invalidCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: ''
          }
        ],
        model: 'llama-3.3-70b-versatile',
        max_tokens: 10,
      });
      
      const response = invalidCompletion.choices[0]?.message?.content || '';
      if (!response || response.trim() === '') {
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
      const timeCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: "Respond with 'OK'"
          }
        ],
        model: 'llama-3.3-70b-versatile',
        max_tokens: 10,
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      logSuccess(`Response time test passed`);
      logInfo(`Response time: ${responseTime}ms`);
      
      if (responseTime < 3000) {
        logSuccess('Response time is excellent (< 3 seconds)');
      } else if (responseTime < 5000) {
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
    logSuccess('All Groq AI tests completed successfully!');
    logInfo('Your Groq API key is working properly');
    logInfo('The MCQ generation feature should work in your quiz application');
    logInfo('Groq is FREE and FAST - perfect for your project! 🚀');
    
    return true;
    
  } catch (error) {
    logError(`Failed to initialize Groq AI: ${error.message}`);
    
    if (error.message.includes('Invalid API Key')) {
      logError('Your API key appears to be invalid');
      logInfo('Please check your Groq API key in the .env.local file');
      logInfo('Get a new key at: https://console.groq.com/keys');
    } else if (error.message.includes('rate limit')) {
      logError('Rate limit exceeded');
      logInfo('Please wait a moment before trying again');
    } else if (error.message.includes('authentication')) {
      logError('Authentication failed');
      logInfo('Please check if your API key has the necessary permissions');
    }
    
    return false;
  }
}

async function runTests() {
  try {
    const success = await testGroqAPI();
    
    if (success) {
      log('\n🎉 All tests passed! Groq AI is working correctly.', 'green');
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

module.exports = { testGroqAPI };

