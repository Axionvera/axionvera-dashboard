import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuditLogView } from '@/features/audit';
import { auditService } from '@/services/auditService';

// Mock the service
jest.mock('@/services/auditService');

const mockLogs = [
    {
        id: 'evt_000001',
        timestamp: new Date().toISOString(),
        user: { id: 'u1', name: 'Alice Johnson', email: 'alice@example.com' },
        action: 'LOGIN' as const,
        resource: 'User',
        status: 'success' as const,
        ipAddress: '192.168.1.1',
        details: { method: 'password' },
    },
    {
        id: 'evt_000002',
        timestamp: new Date().toISOString(),
        user: { id: 'u2', name: 'Bob Smith' },
        action: 'DELETE' as const,
        resource: 'Project',
        resourceId: 'proj_123',
        status: 'failure' as const,
        ipAddress: '192.168.1.2',
        details: { reason: 'Permission denied' },
    },
];

describe('AuditLogView', () => {
    beforeEach(() => {
        (auditService.getLogs as jest.Mock).mockResolvedValue({
            data: mockLogs,
            total: 2,
            page: 1,
            totalPages: 1,
        });
    });

    test('renders audit logs page', async () => {
        render(<AuditLogView />);

        await waitFor(() => {
            expect(screen.getByText('Audit Logs')).toBeInTheDocument();
        });
    });

    test('displays audit log entries', async () => {
        render(<AuditLogView />);

        await waitFor(() => {
            expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
            expect(screen.getByText('Bob Smith')).toBeInTheDocument();
        });
    });

    test('filters logs by search query', async () => {
        render(<AuditLogView />);

        const searchInput = screen.getByPlaceholderText('Search logs...');
        fireEvent.change(searchInput, { target: { value: 'Alice' } });

        const applyButton = screen.getByText('Apply Filters');
        fireEvent.click(applyButton);

        await waitFor(() => {
            expect(auditService.getLogs).toHaveBeenCalledWith(
                expect.objectContaining({ searchQuery: 'Alice' }),
                expect.anything()
            );
        });
    });

    test('filters logs by action', async () => {
        render(<AuditLogView />);

        const actionSelect = screen.getByRole('combobox', { name: /action/i });
        fireEvent.change(actionSelect, { target: { value: 'LOGIN' } });

        const applyButton = screen.getByText('Apply Filters');
        fireEvent.click(applyButton);

        await waitFor(() => {
            expect(auditService.getLogs).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'LOGIN' }),
                expect.anything()
            );
        });
    });

    test('exports logs when export button is clicked', async () => {
        (auditService.exportLogs as jest.Mock).mockResolvedValue('csv,data');

        render(<AuditLogView />);

        await waitFor(() => {
            const exportButton = screen.getByText(/Export CSV/);
            fireEvent.click(exportButton);
        });

        await waitFor(() => {
            expect(auditService.exportLogs).toHaveBeenCalled();
        });
    });

    test('clears filters', async () => {
        render(<AuditLogView />);

        const clearButton = screen.getByText('Clear Filters');
        fireEvent.click(clearButton);

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Search logs...')).toHaveValue('');
        });
    });
});