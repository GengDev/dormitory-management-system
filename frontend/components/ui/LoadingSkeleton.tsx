'use client';

export function LoadingSkeleton({ variant = 'card' }: { variant?: 'card' | 'table' | 'list' | 'text' }) {
    if (variant === 'card') {
        return (
            <div className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-4/6"></div>
            </div>
        );
    }

    if (variant === 'table') {
        return (
            <div className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
                <div className="h-12 bg-gray-200"></div>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 border-t border-gray-200"></div>
                ))}
            </div>
        );
    }

    if (variant === 'list') {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg shadow animate-pulse">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'text') {
        return (
            <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
        );
    }

    return null;
}

export function CardSkeleton() {
    return <LoadingSkeleton variant="card" />;
}

export function TableSkeleton() {
    return <LoadingSkeleton variant="table" />;
}

export function ListSkeleton() {
    return <LoadingSkeleton variant="list" />;
}

export function TextSkeleton() {
    return <LoadingSkeleton variant="text" />;
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
            </div>

            {/* Table */}
            <TableSkeleton />
        </div>
    );
}
