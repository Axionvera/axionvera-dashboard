export interface AuditEvent {
    id: string;
    timestamp: string;
    user: {
        id: string;
        name: string;
        email?: string;
        avatar?: string;
    };
    action: AuditAction;
    resource: string;
    resourceId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    status: 'success' | 'failure' | 'pending';
}

export type AuditAction =
    | 'LOGIN'
    | 'LOGOUT'
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'VIEW'
    | 'EXPORT'
    | 'IMPORT'
    | 'SETTINGS_CHANGE'
    | 'PERMISSION_CHANGE'
    | 'PROFILE_UPDATE'
    | 'PASSWORD_CHANGE';

export interface AuditFilter {
    action?: AuditAction | string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    resource?: string;
    searchQuery?: string;
    status?: 'success' | 'failure' | 'pending' | 'all';
}

export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: keyof AuditEvent;
    sortOrder?: 'asc' | 'desc';
}

export interface AuditResponse {
    data: AuditEvent[];
    total: number;
    page: number;
    totalPages: number;
}

export interface AuditStats {
    totalEvents: number;
    successRate: number;
    topActions: Array<{ action: string; count: number }>;
    eventsByDay: Array<{ date: string; count: number }>;
}