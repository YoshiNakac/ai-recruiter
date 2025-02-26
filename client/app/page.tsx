import JobPostingForm from './components/JobPostingForm';

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI Recruiter Survey
        </h1>
        <p className="text-lg text-gray-600">
          Generate personalized survey questions based on your job posting
        </p>
      </div>
      
      <JobPostingForm />
    </div>
  );
}