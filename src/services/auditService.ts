import {
    AuditEvent,
    AuditFilter,
    PaginationParams,
    AuditResponse,
    AuditStats, AuditAction
} from '@/types/audit';

// Mock data generator - in production, this would be an API call
const generateMockEvents = (count: number = 50): AuditEvent[] => {
    const users = [
        { id: 'u1', name: 'Alice Johnson', email: 'alice@example.com' },
        { id: 'u2', name: 'Bob Smith', email: 'bob@example.com' },
        { id: 'u3', name: 'Carol White', email: 'carol@example.com' },
        { id: 'u4', name: 'David Brown', email: 'david@example.com' },
        { id: 'u5', name: 'Eve Davis', email: 'eve@example.com' },
    ];

    const actions: AuditAction[] = [
        'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE',
        'VIEW', 'EXPORT', 'IMPORT', 'SETTINGS_CHANGE',
        'PERMISSION_CHANGE', 'PROFILE_UPDATE', 'PASSWORD_CHANGE'
    ];

    const resources = ['User', 'Project', 'Document', 'Setting', 'Permission', 'Report', 'Transaction'];
    const statuses = ['success', 'success', 'success', 'success', 'failure', 'pending'];

    const events: AuditEvent[] = [];

    for (let i = 1; i <= count; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const action = actions[Math.floor(Math.random() * actions.length)];
        const resource = resources[Math.floor(Math.random() * resources.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)] as any;

        const daysAgo = Math.floor(Math.random() * 30);
        const hoursAgo = Math.floor(Math.random() * 24);
        const minutesAgo = Math.floor(Math.random() * 60);

        events.push({
            id: `evt_${String(i).padStart(6, '0')}`,
            timestamp: new Date(
                Date.now() - daysAgo * 24 * 60 * 60 * 1000 -
                hoursAgo * 60 * 60 * 1000 - minutesAgo * 60 * 1000
            ).toISOString(),
            user,
            action,
            resource,
            resourceId: Math.random() > 0.3 ? `res_${Math.floor(Math.random() * 100)}` : undefined,
            details: Math.random() > 0.5 ? {
                changes: { field: 'status', old: 'draft', new: 'published' },
                metadata: { version: '1.0', environment: 'production' }
            } : undefined,
            ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            status,
        });
    }

    return events.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
};

// Singleton for mock data
let mockEvents: AuditEvent[] | null = null;

const getMockEvents = (): AuditEvent[] => {
    if (!mockEvents) {
        mockEvents = generateMockEvents(50);
    }
    return mockEvents;
};

export const auditService = {
    async getLogs(
        filter: AuditFilter,
        pagination: PaginationParams
    ): Promise<AuditResponse> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 400));

        let events = getMockEvents();

        // Apply filters
        if (filter.action) {
            events = events.filter(e => e.action === filter.action);
        }

        if (filter.userId) {
            events = events.filter(e => e.user.id === filter.userId);
        }

        if (filter.status && filter.status !== 'all') {
            events = events.filter(e => e.status === filter.status);
        }

        if (filter.resource) {
            events = events.filter(e =>
                e.resource.toLowerCase().includes(filter.resource!.toLowerCase())
            );
        }

        if (filter.dateFrom) {
            events = events.filter(e => e.timestamp >= filter.dateFrom!);
        }

        if (filter.dateTo) {
            events = events.filter(e => e.timestamp <= filter.dateTo!);
        }

        if (filter.searchQuery) {
            const q = filter.searchQuery.toLowerCase();
            events = events.filter(e =>
                e.user.name.toLowerCase().includes(q) ||
                e.action.toLowerCase().includes(q) ||
                e.resource.toLowerCase().includes(q) ||
                e.id.toLowerCase().includes(q) ||
                JSON.stringify(e.details).toLowerCase().includes(q) ||
                (e.user.email && e.user.email.toLowerCase().includes(q))
            );
        }

        // Sort
        const sortBy = pagination.sortBy || 'timestamp';
        const sortOrder = pagination.sortOrder || 'desc';
        events = [...events].sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortOrder === 'desc'
                    ? bVal.localeCompare(aVal)
                    : aVal.localeCompare(bVal);
            }
            if (aVal instanceof Date && bVal instanceof Date) {
                return sortOrder === 'desc'
                    ? bVal.getTime() - aVal.getTime()
                    : aVal.getTime() - bVal.getTime();
            }
            return 0;
        });

        // Pagination
        const total = events.length;
        const start = (pagination.page - 1) * pagination.limit;
        const end = start + pagination.limit;
        const pageData = events.slice(start, end);

        return {
            data: pageData,
            total,
            page: pagination.page,
            totalPages: Math.ceil(total / pagination.limit),
        };
    },

    async getStats(): Promise<AuditStats> {
        const events = getMockEvents();
        const totalEvents = events.length;
        const successEvents = events.filter(e => e.status === 'success').length;

        // Top actions
        const actionCounts = events.reduce((acc, e) => {
            acc[e.action] = (acc[e.action] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topActions = Object.entries(actionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([action, count]) => ({ action, count }));

        // Events by day (last 7 days)
        const now = new Date();
        const dayCounts: Record<string, number> = {};

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const key = date.toISOString().split('T')[0];
            dayCounts[key] = 0;
        }

        events.forEach(e => {
            const key = e.timestamp.split('T')[0];
            if (dayCounts[key] !== undefined) {
                dayCounts[key]++;
            }
        });

        const eventsByDay = Object.entries(dayCounts).map(([date, count]) => ({ date, count }));

        return {
            totalEvents,
            successRate: totalEvents > 0 ? (successEvents / totalEvents) * 100 : 0,
            topActions,
            eventsByDay,
        };
    },

    async exportLogs(filter: AuditFilter): Promise<string> {
        const response = await this.getLogs(filter, { page: 1, limit: 1000 });

        // Create CSV with proper escaping
        const headers = [
            'ID', 'Timestamp', 'User', 'Email', 'Action',
            'Resource', 'Resource ID', 'Status', 'IP Address', 'Details'
        ];

        const rows = response.data.map(e => [
            e.id,
            new Date(e.timestamp).toISOString(),
            e.user.name,
            e.user.email || '',
            e.action,
            e.resource,
            e.resourceId || '',
            e.status,
            e.ipAddress || '',
            JSON.stringify(e.details || {}).replace(/,/g, ';'),
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return csvContent;
    },

    // For testing - add a mock event
    addMockEvent(event: Partial<AuditEvent>): AuditEvent {
        const events = getMockEvents();
        const newEvent: AuditEvent = {
            id: `evt_${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: { id: 'system', name: 'System' },
            action: 'CREATE',
            resource: 'System',
            status: 'success',
            ...event,
        };
        events.unshift(newEvent);
        return newEvent;
    },

    // Reset mock data
    resetMockData(): void {
        mockEvents = generateMockEvents(50);
    }
};