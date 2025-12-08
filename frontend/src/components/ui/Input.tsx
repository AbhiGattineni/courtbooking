import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    large?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            large = false,
            className = '',
            id,
            ...props
        },
        ref
    ) => {
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
        const inputClasses = [
            'form-input',
            large && 'form-input-lg',
            error && 'error',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div className="form-group">
                {label && (
                    <label htmlFor={inputId} className="form-label">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={inputClasses}
                    {...props}
                />
                {error && <span className="form-error">{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
