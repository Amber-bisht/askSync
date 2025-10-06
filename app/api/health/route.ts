import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  try {
    // Test MongoDB connection
    let mongoStatus = 'disconnected';
    try {
      await connectDB();
      mongoStatus = 'connected';
    } catch (error) {
      mongoStatus = 'error';
      console.error('MongoDB connection failed:', error);
    }

    // Test Google Gemini API
    let geminiStatus = 'disconnected';
    try {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      await model.generateContent("Hello");
      geminiStatus = 'connected';
    } catch (error) {
      geminiStatus = 'error';
      console.error('Google Gemini API test failed:', error);
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoStatus,
        googleGemini: geminiStatus,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT || 5000,
        hasMongoUri: !!process.env.MONGODB_URI,
        hasGeminiKey: !!process.env.GOOGLE_GEMINI_API_KEY,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
