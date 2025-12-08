import React from 'react';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'PENDING_PAYMENT' | 'FAILED' | 'CANCELLED_MANUAL';
}

const statusConfig = {
    CONFIRMED: { className: 'status-confirmed', label: 'CONFIRMED', emoji: '✅' },
    PENDING: { className: 'status-pending', label: 'PENDING', emoji: '⏳' },
    PENDING_PAYMENT: { className: 'status-pending', label: 'PENDING', emoji: '⏳' },
    CANCELLED: { className: 'status-cancelled', label: 'CANCELLED', emoji: '❌' },
    CANCELLED_MANUAL: { className: 'status-cancelled', label: 'CANCELLED', emoji: '❌' },
    FAILED: { className: 'status-cancelled', label: 'FAILED', emoji: '❌' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    className = '',
    ...props
}) => {
    const config = statusConfig[status];
    const classes = [
        'status-badge',
        config.className,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <span className={classes} {...props}>
            {config.emoji} {config.label}
        </span>
    );
};

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;
