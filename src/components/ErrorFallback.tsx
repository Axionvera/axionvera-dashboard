import React from 'react';

interface ErrorFallbackProps {
  onReload?: () => void;
  title?: string;
  message?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  onReload,
  title = "Something went wrong",
  message = "We're sorry, but something unexpected happened. The application has encountered an error and needs to reload."
}) => {
  const handleReload = () => {
    if (onReload) {
      onReload();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 text-center transition-all duration-300">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-4 transition-colors">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">
            {title}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6 transition-colors">
            {message}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleReload}
            className="w-full bg-axion-500 hover:bg-axion-600 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-axion-500/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-axion-500 focus:ring-offset-2 active:scale-95"
          >
            Reload Application
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium py-3 px-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 active:scale-95"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};
