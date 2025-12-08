import React from 'react';

export interface SkeletonLoaderProps {
    variant?: 'text' | 'circle' | 'rect';
    width?: string | number;
    height?: string | number;
    className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    variant = 'text',
    width,
    height,
    className = '',
}) => {
    const classes = [
        'skeleton',
        variant === 'text' && 'skeleton-text',
        variant === 'circle' && 'skeleton-circle',
        variant === 'rect' && 'skeleton-rect',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const style: React.CSSProperties = {};

    if (width) {
        style.width = typeof width === 'number' ? `${width}px` : width;
    }

    if (height) {
        style.height = typeof height === 'number' ? `${height}px` : height;
    }

    // Set default dimensions based on variant
    if (variant === 'circle' && !width && !height) {
        style.width = '40px';
        style.height = '40px';
    }

    return <div className={classes} style={style} />;
};

SkeletonLoader.displayName = 'SkeletonLoader';

export default SkeletonLoader;
