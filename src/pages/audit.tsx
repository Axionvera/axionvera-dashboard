import React from 'react';
import type { NextPage } from 'next';
import { AuditLogView } from '@/features/audit';
import Head from 'next/head';

const AuditPage: NextPage = () => {
    return (
        <>
            <Head>
                <title>Audit Logs | Axionvera Dashboard</title>
                <meta name="description" content="View and manage audit logs" />
            </Head>

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <AuditLogView />
            </div>
        </>
    );
};

export default AuditPage;