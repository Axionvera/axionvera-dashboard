import Head from "next/head";
import Link from "next/link";

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found · Axionvera</title>
        <meta name="description" content="The page you&apos;re looking for doesn&apos;t exist" />
      </Head>
      
      <main className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {/* Animated 404 illustration */}
          <div className="relative mb-8">
            <div className="text-9xl font-bold bg-gradient-to-r from-axion-500 to-indigo-500 bg-clip-text text-transparent animate-pulse">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <svg className="w-48 h-48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
            Page Not Found
          </h1>
          
          <p className="text-text-secondary mb-8">
            Oops! The page you&apos;re looking for seems to have wandered off into the Stellar network.
            Don&apos;t worry, we&apos;ll help you find your way back.
          </p>

          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-medium text-white bg-axion-500 rounded-xl hover:bg-axion-400 transition-all duration-200 shadow-lg shadow-axion-500/20 group"
            >
              <svg 
                className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Return to Dashboard
            </Link>
            
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-medium text-text-primary bg-background-secondary rounded-xl hover:bg-background-tertiary transition-all duration-200 border border-border-primary"
            >
              Go to Homepage
            </Link>
          </div>

          {/* Quick links section */}
          <div className="mt-8 pt-6 border-t border-border-primary">
            <p className="text-sm text-text-muted mb-3">Quick links you might find helpful:</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/profile" className="text-sm text-axion-500 hover:text-axion-400 transition">
                Profile
              </Link>
              <span className="text-border-primary">•</span>
              <a href="https://stellar.org/soroban" target="_blank" rel="noopener noreferrer" className="text-sm text-axion-500 hover:text-axion-400 transition">
                Soroban Docs
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}