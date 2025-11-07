import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { testGroqConnection } from '@/lib/groq';

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

    // Test Groq API
    let groqStatus = 'disconnected';
    try {
      const isConnected = await testGroqConnection();
      groqStatus = isConnected ? 'connected' : 'error';
    } catch (error) {
      groqStatus = 'error';
      console.error('Groq API test failed:', error);
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoStatus,
        groqAI: groqStatus,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT || 5000,
        hasMongoUri: !!process.env.MONGODB_URI,
        hasGroqKey: !!process.env.GROQ_API_KEY,
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
