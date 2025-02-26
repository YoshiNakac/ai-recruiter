import { NextResponse } from 'next/server';
import { SurveyQuestion } from '../../lib/types';

export async function POST(request: Request) {
  try {
    const { jobDescription } = await request.json();

    if (!jobDescription) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }

    const sanitizedJobDescription = jobDescription.trim();

    // Check if the job description is too short
    if (sanitizedJobDescription.length < 20) {
      return NextResponse.json(
        { error: 'Job description is too short. Please provide more details.' },
        { status: 400 }
      );
    }

    try {
      const questions = await generateWithOpenAI(sanitizedJobDescription);
      return NextResponse.json({ questions });
    } catch (generationError) {
      console.error('Error in AI generation:', generationError);
      
      // Provide fallback questions if AI generation fails
      const fallbackQuestions = [
        {
          id: 1,
          question: "What specific skills and technologies are most important for this role?",
          category: "skills"
        },
        {
          id: 2,
          question: "Could you describe the team structure this position would be part of?",
          category: "team"
        },
        {
          id: 3,
          question: "What would success look like for this role in the first 90 days?",
          category: "success_metrics"
        },
        {
          id: 4,
          question: "What is the company culture like, especially regarding work-life balance?",
          category: "culture"
        },
        {
          id: 5,
          question: "Are there any additional qualifications or experiences that might not be in the job posting but would be valuable?",
          category: "qualifications"
        }
      ];
      
      return NextResponse.json({ questions: fallbackQuestions });
    }
  } catch (error) {
    console.error('Error handling request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

async function generateWithOpenAI(jobDescription: string): Promise<SurveyQuestion[]> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', 
        messages: [
          {
            role: 'system',
            content: `You are an AI specialized in HR and recruitment. Your task is to analyze job descriptions and create insightful questions that recruiters can ask to gain more context about the role.
            
Your questions should focus on:
1. Uncovering specific technical or soft skills that might not be explicitly stated
2. Understanding team dynamics and company culture
3. Clarifying expectations and success metrics
4. Identifying potential challenges in the role
5. Determining what type of candidate would thrive in this position

Format your response as a valid JSON object containing an array of questions with the following structure:
{
  "questions": [
    {
      "id": 1,
      "question": "Clear, concise question text",
      "category": "One of: skills, culture, expectations, challenges, candidate_fit"
    }
  ]
}

Ensure your JSON is properly formatted and valid. Do not include any explanations or text outside the JSON structure.`
          },
          {
            role: 'user',
            content: `Here is a job posting. Please create 5-7 thoughtful questions based on this content:
            
${jobDescription}`
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    try {
      const jsonString = data.choices[0].message.content;
      const match = jsonString.match(/```json\n([\s\S]*?)\n```/) || 
                   jsonString.match(/```\n([\s\S]*?)\n```/) ||
                   jsonString.match(/{[\s\S]*}/);
                   
      const jsonContent = match ? match[1] || match[0] : jsonString;
      
      // Parse and validate the JSON
      const parsed = JSON.parse(jsonContent);
      
      if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        throw new Error('Invalid response format: missing questions array');
      }
      
      // Validate each question
      const validatedQuestions = parsed.questions.map((q, index) => ({
        id: q.id || index + 1,
        question: q.question || `Question ${index + 1}`,
        category: q.category || 'general'
      }));
      
      return validatedQuestions;
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Raw response:', data.choices[0].message.content);
      throw new Error('Failed to parse AI response');
    }
  } catch (apiError) {
    console.error('OpenAI API request failed:', apiError);
    throw apiError;
  }
}