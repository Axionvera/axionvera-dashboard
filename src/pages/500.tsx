import Head from "next/head";
import Link from "next/link";
import { useState } from "react";

export default function Custom500() {
  const [showDetails, setShowDetails] = useState(false);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <>
      <Head>
        <title>Server Error · Axionvera</title>
        <meta name="description" content="Something went wrong on our end" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <main className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {/* Server error illustration */}
          <div className="relative mb-8">
            <div className="text-9xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              500
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <svg className="w-48 h-48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
            Server Error
          </h1>
          
          <p className="text-text-secondary mb-4">
            Something went wrong on our end. We&apos;ve been notified and are working to fix the issue.
          </p>
          
          <p className="text-text-muted text-sm mb-8">
            Please try again in a few moments. If the problem persists, don&apos;t hesitate to reach out to our support team.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-medium text-white bg-axion-500 rounded-xl hover:bg-axion-400 transition-all duration-200 shadow-lg shadow-axion-500/20 group"
            >
              <svg 
                className="w-5 h-5 mr-2 transform group-hover:rotate-180 transition-transform duration-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
            
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-medium text-text-primary bg-background-secondary rounded-xl hover:bg-background-tertiary transition-all duration-200 border border-border-primary"
            >
              Go to Dashboard
            </Link>
          </div>

          {/* Support section */}
          <div className="mt-8 pt-6 border-t border-border-primary">
            <p className="text-sm text-text-secondary">
              Need immediate assistance?{" "}
              <a 
                href="mailto:support@axionvera.com" 
                className="text-axion-500 hover:text-axion-400 transition font-medium"
              >
                Contact Support
              </a>
            </p>
            
            {/* Error details toggle (helpful for debugging) */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mt-3 text-xs text-text-muted hover:text-text-secondary transition"
            >
              {showDetails ? "Hide" : "Show"} technical details
            </button>
            
            {showDetails && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-left">
                <p className="text-xs text-text-muted font-mono">
                  Error Code: 500 - Internal Server Error<br />
                  Timestamp: {new Date().toISOString()}<br />
                  Please share this information if contacting support.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}