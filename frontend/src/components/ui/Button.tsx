import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: 'true' | 'false';
    loading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            fullWidth,
            loading = false,
            icon,
            iconPosition = 'left',
            children,
            className = '',
            disabled,
            ...props
        },
        ref
    ) => {
        const classes = [
            'btn',
            `btn-${variant}`,
            `btn-${size}`,
            fullWidth && 'btn-full',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <button
                ref={ref}
                className={classes}
                disabled={disabled || loading}
                {...props}
            >
                {loading && <span className="spinner">⏳</span>}
                {!loading && icon && iconPosition === 'left' && <span>{icon}</span>}
                {children}
                {!loading && icon && iconPosition === 'right' && <span>{icon}</span>}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
