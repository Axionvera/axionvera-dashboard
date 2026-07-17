import { useState, useEffect, useCallback } from 'react';
import { AuditEvent, AuditFilter } from '@/types/audit';
import { auditService } from '@/services/auditService';
import { useDebounce } from './useDebounce';

interface UseAuditLogsOptions {
    initialPageSize?: number;
    initialFilters?: AuditFilter;
    autoFetch?: boolean;
}

export function useAuditLogs({
                                 initialPageSize = 20,
                                 initialFilters = {},
                                 autoFetch = true,
                             }: UseAuditLogsOptions = {}) {
    const [logs, setLogs] = useState<AuditEvent[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<AuditFilter>(initialFilters);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [sortBy, setSortBy] = useState<keyof AuditEvent>('timestamp');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const debouncedFilters = useDebounce(filters, 300);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await auditService.getLogs(
                debouncedFilters,
                { page, limit: pageSize, sortBy, sortOrder }
            );
            setLogs(result.data);
            setTotal(result.total);
            setTotalPages(result.totalPages);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch audit logs');
            console.error('Error fetching logs:', err);
        } finally {
            setLoading(false);
        }
    }, [debouncedFilters, page, pageSize, sortBy, sortOrder]);

    useEffect(() => {
        if (autoFetch) {
            fetchLogs();
        }
    }, [fetchLogs, autoFetch]);

    const refresh = useCallback(() => {
        fetchLogs();
    }, [fetchLogs]);

    const exportLogs = useCallback(async () => {
        setLoading(true);
        try {
            const csv = await auditService.exportLogs(debouncedFilters);
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err: any) {
            setError(err.message || 'Export failed');
            console.error('Export error:', err);
        } finally {
            setLoading(false);
        }
    }, [debouncedFilters]);

    const clearFilters = useCallback(() => {
        setFilters({});
        setPage(1);
    }, []);

    const goToPage = useCallback((newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    }, [totalPages]);

    return {
        logs,
        total,
        totalPages,
        loading,
        error,
        filters,
        setFilters,
        clearFilters,
        page,
        setPage: goToPage,
        pageSize,
        setPageSize,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        refresh,
        exportLogs,
    };
}