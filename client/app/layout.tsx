import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Recruiter Survey',
  description: 'Generate personalized survey questions for recruiters based on job postings',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-bold text-gray-900">
                AI Recruiter Survey
              </h1>
            </div>
          </header>
          
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </main>
          
          <footer className="bg-white border-t border-gray-200 py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
              <p>© {new Date().getFullYear()} AI Recruiter Survey</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}