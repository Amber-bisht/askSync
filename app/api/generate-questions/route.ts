import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

// Helper function to extract JSON from markdown code blocks
function extractJsonFromMarkdown(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  
  // If no code blocks found, try to find JSON array pattern
  const arrayMatch = text.match(/\[\s*\{[\s\S]*?\}\s*\]/);
  if (arrayMatch) {
    return arrayMatch[0].trim();
  }
  
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
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  return jsonStr;
}

export async function POST(request: NextRequest) {
  try {
    const { topic, numQuestions, reference, includeImages = false } = await request.json();

    if (!topic || !numQuestions || !reference) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
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

        // Check usage limits based on subscription status
        if (dbUser.questionAiUsed >= dbUser.questionAiLimit) {
          return NextResponse.json({ 
            error: dbUser.isPaid 
              ? 'Q&A generation limit reached. Please contact support for assistance.'
              : 'Free Q&A generation limit reached. Please upgrade to generate more questions.',
            limitReached: true,
            upgradeRequired: !dbUser.isPaid
          }, { status: 403 });
        }

    // Build prompt based on whether images are requested
    let prompt = `Generate ${numQuestions} multiple choice questions about ${topic} based on ${reference}. 
    Each question should have 4 options (A, B, C, D) with only one correct answer.
    IMPORTANT: Include the correctAnswer field with the exact text of the correct option.`;

    if (includeImages) {
      prompt += ` 
      For each question, suggest an appropriate image URL that would help illustrate the question. 
      Use placeholder image URLs like "https://via.placeholder.com/400x300?text=Question+Image" or 
      "https://picsum.photos/400/300" for demonstration purposes.`;
    }

    prompt += `
    Return ONLY valid JSON array:
    [{"question":"Question text?","options":["A","B","C","D"],"correctAnswer":"A"`;

    if (includeImages) {
      prompt += `,
        "imageUrl": "https://example.com/image.jpg"`;
    }

    prompt += `}]`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent([
      "You are an expert educator creating multiple choice questions. Always respond with valid JSON.",
      prompt
    ]);
    
    const content = result.response.text();
    
    if (!content) {
      throw new Error('No response from Google Gemini');
    }

    // Try to parse the JSON response
    let questions;
    try {
      const cleanedContent = extractJsonFromMarkdown(content);
      const finalContent = cleanJsonString(cleanedContent);
      questions = JSON.parse(finalContent);
    } catch (parseError) {
      console.error('Error parsing questions:', parseError);
      console.error('Raw content:', content);
      console.error('Cleaned content:', extractJsonFromMarkdown(content));
      console.error('Final content:', cleanJsonString(extractJsonFromMarkdown(content)));
      
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse Google Gemini response');
      }
    }

    // Update usage count
    await User.findByIdAndUpdate(dbUser._id, {
      $inc: { questionAiUsed: 1 }
    });

    return NextResponse.json({ 
      questions,
      message: 'Questions generated successfully'
    });
  } catch (error) {
    console.error('Error generating questions:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
