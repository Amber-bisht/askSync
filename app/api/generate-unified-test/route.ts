import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import connectDB from '@/lib/mongodb';
import { UnifiedTest, IUnifiedTestQuestion } from '@/models/UnifiedTest';
import User from '@/models/User';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

// Helper function to extract JSON from markdown code blocks
function extractJsonFromMarkdown(text: string): string {
  // Remove markdown code block syntax
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  
  // If no code blocks found, try to find JSON array pattern
  const arrayMatch = text.match(/\[\s*\{[\s\S]*?\}\s*\]/);
  if (arrayMatch) {
    return arrayMatch[0].trim();
  }
  
  // If still no match, return the original text
  return text.trim();
}

// Helper function to clean and fix common JSON issues
function cleanJsonString(jsonStr: string): string {
  // Remove any text before the first [
  const startIndex = jsonStr.indexOf('[');
  if (startIndex > 0) {
    jsonStr = jsonStr.substring(startIndex);
  }
  
  // Remove any text after the last ]
  const lastIndex = jsonStr.lastIndexOf(']');
  if (lastIndex > 0 && lastIndex < jsonStr.length - 1) {
    jsonStr = jsonStr.substring(0, lastIndex + 1);
  }
  
  // Fix common issues
  jsonStr = jsonStr
    .replace(/,\s*}/g, '}') // Remove trailing commas before }
    .replace(/,\s*]/g, ']') // Remove trailing commas before ]
    .replace(/\n\s*\n/g, '\n') // Remove empty lines
    .replace(/\\"/g, '"') // Fix escaped quotes
    .replace(/\\n/g, ' ') // Replace newlines with spaces
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks that break JSON
    .replace(/`[^`]*`/g, '') // Remove inline code snippets
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  return jsonStr;
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { topic, reference, mcqCount, qaCount, useSameReference, testName, timeLimit, isPublic, showResults, allowAnonymous, accessListId, createdBy, publishTest, questions: existingQuestions } = requestBody;
    
    console.log('Received test creation request:', {
      testName,
      isPublic,
      accessListId,
      showResults,
      questionsCount: existingQuestions?.length || 0
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

        // Check AI generation limits before generating questions
        if (mcqCount > 0 && dbUser.mcqAiUsed + mcqCount > dbUser.mcqAiLimit) {
          return NextResponse.json({
            error: dbUser.isPaid 
              ? `MCQ generation limit exceeded. You can generate ${dbUser.mcqAiLimit - dbUser.mcqAiUsed} more MCQs.`
              : `Free MCQ generation limit exceeded. You can generate ${dbUser.mcqAiLimit - dbUser.mcqAiUsed} more MCQs. Please upgrade to generate more.`,
            limitReached: true,
            upgradeRequired: !dbUser.isPaid
          }, { status: 403 });
        }

        if (qaCount > 0 && dbUser.questionAiUsed + qaCount > dbUser.questionAiLimit) {
          return NextResponse.json({
            error: dbUser.isPaid 
              ? `Q&A generation limit exceeded. You can generate ${dbUser.questionAiLimit - dbUser.questionAiUsed} more Q&As.`
              : `Free Q&A generation limit exceeded. You can generate ${dbUser.questionAiLimit - dbUser.questionAiUsed} more Q&As. Please upgrade to generate more.`,
            limitReached: true,
            upgradeRequired: !dbUser.isPaid
          }, { status: 403 });
        }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const questions = existingQuestions || [];
    let questionId = questions.length + 1;

    // Generate MCQ questions
    if (mcqCount > 0) {
      const mcqPrompt = `Generate ${mcqCount} multiple choice questions about "${topic}". 
      ${reference ? `Reference: ${reference}` : ''}
      
      Requirements:
      - Clear questions (NO code snippets or backticks)
      - 4 options (A, B, C, D)
      - 1 point each
      - Keep questions simple and text-only
      - IMPORTANT: Include the correctAnswer field with the exact text of the correct option
      
      Return ONLY valid JSON array:
      [{"question":"Question text","options":["A","B","C","D"],"correctAnswer":"A","points":1}]`;

      let mcqResult;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          mcqResult = await model.generateContent(mcqPrompt);
          break;
        } catch (error: unknown) {
          retryCount++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage?.includes('503') || errorMessage?.includes('overloaded')) {
            if (retryCount < maxRetries) {
              console.log(`API overloaded, retrying in ${retryCount * 2} seconds... (attempt ${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
              continue;
            }
          }
          throw error;
        }
      }
      
      if (!mcqResult) {
        throw new Error('Failed to generate MCQ questions after retries');
      }
      
      const mcqResponse = await mcqResult.response;
      const mcqText = mcqResponse.text();
      
      try {
        const cleanedMcqText = extractJsonFromMarkdown(mcqText);
        const finalMcqText = cleanJsonString(cleanedMcqText);
        const mcqQuestions = JSON.parse(finalMcqText);
        mcqQuestions.forEach((q: { question: string; options: string[]; correctAnswer: string; explanation?: string; points?: number }) => {
          questions.push({
            id: `mcq_${questionId++}`,
            type: 'mcq',
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer, // Include the correct answer
            points: q.points || 1,
            isRequired: true
          });
        });
      } catch (error) {
        console.error('Error parsing MCQ questions:', error);
        console.error('Raw MCQ text:', mcqText);
        console.error('Cleaned MCQ text:', extractJsonFromMarkdown(mcqText));
        console.error('Final MCQ text:', cleanJsonString(extractJsonFromMarkdown(mcqText)));
        
        // Fallback: create simple MCQ questions
        for (let i = 0; i < mcqCount; i++) {
          questions.push({
            id: `mcq_${questionId++}`,
            type: 'mcq',
            question: `Question ${i + 1} about ${topic}`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            points: 1,
            isRequired: true
          });
        }
      }
    }

    // Generate Q&A questions
    if (qaCount > 0) {
      const qaPrompt = `Generate ${qaCount} open-ended questions about "${topic}". 
      ${reference && !useSameReference ? `Reference: ${reference}` : ''}
      
      Requirements:
      - Clear questions (NO code snippets or backticks)
      - Open-ended format
      - 2 points each
      - Keep questions simple and text-only
      
      Return ONLY valid JSON array:
      [{"question":"Question text","points":2}]`;

      let qaResult;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          qaResult = await model.generateContent(qaPrompt);
          break;
        } catch (error: unknown) {
          retryCount++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage?.includes('503') || errorMessage?.includes('overloaded')) {
            if (retryCount < maxRetries) {
              console.log(`API overloaded, retrying in ${retryCount * 2} seconds... (attempt ${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
              continue;
            }
          }
          throw error;
        }
      }
      
      if (!qaResult) {
        throw new Error('Failed to generate Q&A questions after retries');
      }
      
      const qaResponse = await qaResult.response;
      const qaText = qaResponse.text();
      
      try {
        const cleanedQaText = extractJsonFromMarkdown(qaText);
        const finalQaText = cleanJsonString(cleanedQaText);
        const qaQuestions = JSON.parse(finalQaText);
        qaQuestions.forEach((q: { question: string; answer: string; explanation?: string; points?: number }) => {
          questions.push({
            id: `qa_${questionId++}`,
            type: 'qa',
            question: q.question,
            points: q.points || 2,
            isRequired: true
          });
        });
      } catch (error) {
        console.error('Error parsing Q&A questions:', error);
        console.error('Raw Q&A text:', qaText);
        console.error('Cleaned Q&A text:', extractJsonFromMarkdown(qaText));
        console.error('Final Q&A text:', cleanJsonString(extractJsonFromMarkdown(qaText)));
        
        // Fallback: create simple Q&A questions
        for (let i = 0; i < qaCount; i++) {
          questions.push({
            id: `qa_${questionId++}`,
            type: 'qa',
            question: `Explain ${topic} in detail (Question ${i + 1})`,
            points: 2,
            isRequired: true
          });
        }
      }
    }

    // If publishTest is true, create and publish the test
    if (publishTest && testName && createdBy) {
      // Check test creation limits
      if (!dbUser.isPaid) {
        // Free users: 5 tests total
        if (dbUser.testsCreated >= dbUser.maxFreeTests) {
          return NextResponse.json({ 
            error: 'Free test limit reached. Upgrade to create more tests.', 
            testsRemaining: 0,
            limit: dbUser.maxFreeTests,
            isPaid: false
          }, { status: 403 });
        }
      } else {
        // Paid users: 10 tests per month
        if (dbUser.monthlyTestsUsed >= dbUser.maxMonthlyTests) {
          return NextResponse.json({ 
            error: 'Monthly test limit reached. Limit resets next month.', 
            testsRemaining: 0,
            limit: dbUser.maxMonthlyTests,
            isPaid: true,
            resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
          }, { status: 403 });
        }
      }

      // Generate unique test link
      const testLink = `test-${uuidv4().substring(0, 8)}`;

      // Create the test
      const testData: {
        testName: string;
        description: string;
        questions: IUnifiedTestQuestion[];
        timeLimit: number;
        isPublic: boolean;
        showResults: boolean;
        allowAnonymous: boolean;
        testLink: string;
        createdBy: string;
        isActive: boolean;
        accessListId?: string;
        settings: {
          allowAnonymous: boolean;
          showResults: boolean;
          timeLimit: number;
          isPublic: boolean;
          accessListId?: string;
        };
      } = {
        testName,
        description: reference, // Use reference as description
        questions,
        timeLimit: timeLimit || 30,
        isPublic: isPublic !== undefined ? isPublic : true,
        showResults: showResults !== undefined ? showResults : true,
        allowAnonymous: allowAnonymous !== undefined ? allowAnonymous : true,
        testLink,
        createdBy: session.user.email,
        isActive: true,
        settings: {
          allowAnonymous: allowAnonymous !== undefined ? allowAnonymous : true,
          showResults: showResults !== undefined ? showResults : true,
          timeLimit: timeLimit || 30,
          isPublic: isPublic !== undefined ? isPublic : true
        }
      };

      // Only add accessListId if test is private and accessListId is provided
      console.log('Access control check:', {
        isPublic: testData.isPublic,
        accessListId,
        willAddAccessList: !testData.isPublic && accessListId
      });
      
      if (!testData.isPublic && accessListId) {
        testData.accessListId = accessListId;
        testData.settings.accessListId = accessListId;
        console.log('Added accessListId to test data:', accessListId);
      }

      const test = new UnifiedTest(testData);

      await test.save();

      // Update user's test creation count and AI generation counts
      const updateFields: { $inc: { testsCreated: number; mcqAiUsed?: number; questionAiUsed?: number } } = { 
        $inc: { testsCreated: 1 } 
      };

      // Count MCQ and Q&A questions generated
      const actualMcqCount = questions.filter((q: { type: string }) => q.type === 'mcq').length;
      const actualQaCount = questions.filter((q: { type: string }) => q.type === 'qa').length;

      // Update AI generation limits
      if (actualMcqCount > 0) {
        updateFields.$inc.mcqAiUsed = actualMcqCount;
      }

      if (actualQaCount > 0) {
        updateFields.$inc.questionAiUsed = actualQaCount;
      }
      
      await User.findByIdAndUpdate(dbUser._id, updateFields);

      // Calculate remaining tests for response
      const testsRemaining = Math.max(0, dbUser.testsLimit - (dbUser.testsCreated + 1));

      // Calculate remaining AI generation limits
      const mcqRemaining = Math.max(0, dbUser.mcqAiLimit - (dbUser.mcqAiUsed + actualMcqCount));
      const qaRemaining = Math.max(0, dbUser.questionAiLimit - (dbUser.questionAiUsed + actualQaCount));

      return NextResponse.json({
        success: true,
        questions,
        test: {
          _id: test._id,
          testName,
          testLink,
          topic,
          reference,
          questions,
          timeLimit: timeLimit || 30
        },
        testsRemaining,
        limit: dbUser.isPaid ? dbUser.maxMonthlyTests : dbUser.maxFreeTests,
        isPaid: dbUser.isPaid,
        mcqAiUsed: dbUser.mcqAiUsed + actualMcqCount,
        mcqAiLimit: dbUser.mcqAiLimit,
        questionAiUsed: dbUser.questionAiUsed + actualQaCount,
        questionAiLimit: dbUser.questionAiLimit,
        aiLimits: {
          mcq: {
            used: actualMcqCount,
            remaining: mcqRemaining,
            limit: dbUser.isPaid ? dbUser.maxMonthlyMcq : dbUser.maxFreeMcq
          },
          qa: {
            used: actualQaCount,
            remaining: qaRemaining,
            limit: dbUser.isPaid ? dbUser.maxMonthlyQa : dbUser.maxFreeQa
          }
        },
        message: `Generated ${questions.length} questions and created test successfully`
      });
    }

    // Calculate AI generation counts for non-published tests
    const actualMcqCount = questions.filter((q: { type: string }) => q.type === 'mcq').length;
    const actualQaCount = questions.filter((q: { type: string }) => q.type === 'qa').length;

    // Update AI generation counts even for non-published tests
    const updateFields: { $inc: { mcqAiUsed?: number; questionAiUsed?: number } } = { 
      $inc: {} 
    };

    if (actualMcqCount > 0) {
      updateFields.$inc.mcqAiUsed = actualMcqCount;
    }

    if (actualQaCount > 0) {
      updateFields.$inc.questionAiUsed = actualQaCount;
    }

    if (Object.keys(updateFields.$inc).length > 0) {
      await User.findByIdAndUpdate(dbUser._id, updateFields);
    }

    return NextResponse.json({ 
      questions,
      mcqAiUsed: dbUser.mcqAiUsed + actualMcqCount,
      mcqAiLimit: dbUser.mcqAiLimit,
      questionAiUsed: dbUser.questionAiUsed + actualQaCount,
      questionAiLimit: dbUser.questionAiLimit,
      message: `Generated ${questions.length} questions successfully`
    });

  } catch (error) {
    console.error('Error generating unified test:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}

