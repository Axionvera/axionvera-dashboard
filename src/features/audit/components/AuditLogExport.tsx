import React from 'react';

interface Props {
    onExport: () => void;
    disabled?: boolean;
    loading?: boolean;
    total?: number;
}

export const AuditLogExport: React.FC<Props> = ({
                                                    onExport,
                                                    disabled = false,
                                                    loading = false,
                                                    total = 0,
                                                }) => {
    return (
        <button
            onClick={onExport}
            disabled={disabled || loading || total === 0}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                disabled || loading || total === 0
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
            }`}
        >
            {loading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Exporting...
                </>
            ) : (
                <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                </>
            )}
            {total > 0 && !loading && (
                <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded">
          {total} logs
        </span>
            )}
        </button>
    );
};