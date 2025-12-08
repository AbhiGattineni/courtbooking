import React from 'react';

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
    icon?: React.ReactNode;
    onRemove?: () => void;
}

export const Chip: React.FC<ChipProps> = ({
    variant = 'default',
    icon,
    onRemove,
    children,
    className = '',
    ...props
}) => {
    const classes = [
        'chip',
        `chip-${variant}`,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <span className={classes} {...props}>
            {icon && <span>{icon}</span>}
            {children}
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="chip-remove"
                    aria-label="Remove"
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        marginLeft: '0.25rem',
                        padding: 0,
                        fontSize: '0.875rem',
                        opacity: 0.7,
                    }}
                >
                    ×
                </button>
            )}
        </span>
    );
};

Chip.displayName = 'Chip';

export default Chip;
