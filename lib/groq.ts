import Groq from 'groq-sdk';

// Initialize Groq client
export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set');
  }
  
  return new Groq({
    apiKey: apiKey,
  });
}

// Helper function to generate content using Groq
export async function generateGroqContent(prompt: string, systemPrompt?: string) {
  const groq = getGroqClient();
  
  const messages: any[] = [];
  
  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt,
    });
  }
  
  messages.push({
    role: 'user',
    content: prompt,
  });
  
  const completion = await groq.chat.completions.create({
    messages: messages,
    model: 'llama-3.3-70b-versatile', // Fast and good for quiz generation (updated model)
    temperature: 0.7,
    max_tokens: 2048,
    top_p: 1,
    stream: false,
  });
  
  return completion.choices[0]?.message?.content || '';
}

// Test Groq connection
export async function testGroqConnection() {
  try {
    const groq = getGroqClient();
    await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'llama-3.3-70b-versatile',
      max_tokens: 10,
    });
    return true;
  } catch (error) {
    console.error('Groq connection test failed:', error);
    return false;
  }
}

