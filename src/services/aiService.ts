import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
});

export const getAIAnswer = async (question: string, subject?: string): Promise<string> => {
  try {
    const subjectContext = subject ? `The question is about ${subject}. ` : '';
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert tutor for KOlachi Tutor. Provide clear, educational, and helpful answers to student questions. Be concise but thorough.'
        },
        {
          role: 'user',
          content: `${subjectContext}Question: ${question}\n\nPlease provide a helpful answer:`
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || 'I apologize, but I could not generate an answer at this time.';
  } catch (error) {
    console.error('AI Error:', error);
    return 'I apologize, but I could not generate an answer at this time. Please try again later.';
  }
};
