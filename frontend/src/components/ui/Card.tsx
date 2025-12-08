import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    padding?: 'sm' | 'md' | 'lg';
    hoverable?: boolean;
    bordered?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    (
        {
            padding = 'lg',
            hoverable = false,
            bordered = false,
            children,
            className = '',
            ...props
        },
        ref
    ) => {
        const classes = [
            'card',
            `card-${padding}`,
            hoverable && 'card-hoverable',
            bordered && 'card-bordered',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div ref={ref} className={classes} {...props}>
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

export default Card;
