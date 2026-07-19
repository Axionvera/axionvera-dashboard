import React from 'react';
import { AuditEvent } from '@/types/audit';

interface Props {
    logs: AuditEvent[];
    total: number;
    loading: boolean;
}

export const AuditLogTable: React.FC<Props> = ({
                                                   logs,
                                                   total,
                                                   loading,
                                               }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'failure':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return '✅';
            case 'failure':
                return '❌';
            case 'pending':
                return '⏳';
            default:
                return '⚪';
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'DELETE':
                return 'text-red-600 dark:text-red-400';
            case 'CREATE':
                return 'text-green-600 dark:text-green-400';
            case 'UPDATE':
                return 'text-blue-600 dark:text-blue-400';
            case 'LOGIN':
                return 'text-purple-600 dark:text-purple-400';
            case 'LOGOUT':
                return 'text-gray-600 dark:text-gray-400';
            default:
                return 'text-gray-600 dark:text-gray-300';
        }
    };

    if (loading && logs.length === 0) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (logs.length === 0 && !loading) {
        return (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No audit logs found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Try adjusting your filters or search query.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Details
                    </th>
                </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {new Date(event.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-300 font-medium">
                      {event.user.name.charAt(0).toUpperCase()}
                    </span>
                                </div>
                                <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {event.user.name}
                                    </div>
                                    {event.user.email && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {event.user.email}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                <span className={`text-sm font-medium ${getActionColor(event.action)}`}>
                  {event.action}
                </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {event.resource}
                </span>
                            {event.resourceId && (
                                <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                    #{event.resourceId}
                  </span>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(event.status)}`}>
                  {getStatusIcon(event.status)}
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {event.ipAddress || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                            {event.details && Object.keys(event.details).length > 0
                                ? JSON.stringify(event.details).slice(0, 50) + (JSON.stringify(event.details).length > 50 ? '...' : '')
                                : '-'}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};