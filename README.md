# AI Recruiter Survey

A Next.js application that allows recruiters to upload job descriptions, generate insightful survey questions using AI, and record audio responses to gather context about job roles.

## Features

- **Job Description Processing**: Upload .txt/.docx/pdf files or manually enter job descriptions
- **AI-Generated Questions**: Automatically generate relevant survey questions using OpenAI's API
- **Voice Responses**: Record audio answers to survey questions
- **Progress Tracking**: Navigate through survey questions with progress indicators
- **Data Storage**: Store job postings, questions, and audio responses in Supabase

## Tech Stack

- **Frontend**: Next.js with TypeScript and React
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **AI**: OpenAI API (GPT-3.5 Turbo)

## Prerequisites

Before you start, make sure you have:

- Node.js (v14.x or later)
- npm or yarn
- A Supabase account (free tier is fine)
- An OpenAI API key

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/YourUsername/ai-recruiter.git
cd ai-recruiter
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

### 4. Set Up Supabase

1. Create a new project in [Supabase](https://supabase.com/)
2. Get your API URL and anon key from Settings > API
3. Create the required tables using SQL Editor:

```sql
-- Job postings table
CREATE TABLE job_postings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    document_url TEXT,
    questions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Survey responses table
CREATE TABLE survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_posting_id UUID REFERENCES job_postings(id),
    question_id INTEGER NOT NULL,
    audio_url TEXT,
    transcript TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name) VALUES ('job_documents', 'job_documents');
CREATE POLICY "Public Access Documents" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id = 'job_documents');

INSERT INTO storage.buckets (id, name) VALUES ('audio_recordings', 'audio_recordings');
CREATE POLICY "Public Access Audio" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id = 'audio_recordings');
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage Guide

### Creating a New Survey

1. Enter a job title
2. Either upload a document (.txt, .docx) or manually enter the job description
3. Click "Generate Survey Questions"
4. The AI will analyze the job description and create relevant survey questions

### Answering Survey Questions

1. For each question, click the "Record" button to record your audio response
2. Click "Stop" when you're done recording
3. You can replay your recording and re-record if needed
4. Click "Next Question" to proceed to the next question
5. On the final question, click "Complete Survey"

### Reviewing Submissions

Currently, responses are stored in Supabase but the application doesn't include a review interface. Future versions may include:
- A dashboard to view all job postings
- Playback for recorded responses
- Transcript generation and analysis

## Troubleshooting

### Common Issues

**Recording permission denied**: Make sure your browser has permission to access your microphone.

**OpenAI API errors**: If question generation fails, check your API key and quota. The application will fall back to default questions if needed.

