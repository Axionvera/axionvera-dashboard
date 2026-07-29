import React, { useState, useCallback } from 'react';
import { AuditFilter, AuditAction } from '@/types/audit';

interface Props {
    filters: AuditFilter;
    onFilterChange: (filters: AuditFilter) => void;
    onClearFilters: () => void;
    loading?: boolean;
}

const actionOptions: AuditAction[] = [
    'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE',
    'DELETE', 'VIEW', 'EXPORT', 'IMPORT',
    'SETTINGS_CHANGE', 'PERMISSION_CHANGE', 'PROFILE_UPDATE', 'PASSWORD_CHANGE'
];

export const AuditLogFilter: React.FC<Props> = ({
                                                    filters,
                                                    onFilterChange,
                                                    onClearFilters,
                                                    loading = false,
                                                }) => {
    const [localFilters, setLocalFilters] = useState<AuditFilter>(filters);

    const handleChange = useCallback((
        key: keyof AuditFilter,
        value: string
    ) => {
        setLocalFilters(prev => ({
            ...prev,
            [key]: value || undefined
        }));
    }, []);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        onFilterChange(localFilters);
    }, [localFilters, onFilterChange]);

    const handleReset = useCallback(() => {
        setLocalFilters({});
        onClearFilters();
    }, [onClearFilters]);

    return (
        <form onSubmit={handleSubmit} className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Input */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={localFilters.searchQuery || ''}
                        onChange={(e) => handleChange('searchQuery', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        disabled={loading}
                    />
                    <svg
                        className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                {/* Action Filter */}
                <select
                    value={localFilters.action || ''}
                    onChange={(e) => handleChange('action', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                >
                    <option value="">All Actions</option>
                    {actionOptions.map(action => (
                        <option key={action} value={action}>{action}</option>
                    ))}
                </select>

                {/* Status Filter */}
                <select
                    value={localFilters.status || 'all'}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                >
                    <option value="all">All Status</option>
                    <option value="success">✅ Success</option>
                    <option value="failure">❌ Failed</option>
                    <option value="pending">⏳ Pending</option>
                </select>

                {/* Date Range */}
                <div className="flex gap-2">
                    <input
                        type="date"
                        value={localFilters.dateFrom || ''}
                        onChange={(e) => handleChange('dateFrom', e.target.value)}
                        className="w-1/2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        disabled={loading}
                    />
                    <input
                        type="date"
                        value={localFilters.dateTo || ''}
                        onChange={(e) => handleChange('dateTo', e.target.value)}
                        className="w-1/2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        disabled={loading}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
                <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    disabled={loading}
                >
                    Clear Filters
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Applying...' : 'Apply Filters'}
                </button>
            </div>
        </form>
    );
};