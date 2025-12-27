import React from 'react';
import logoPlaceholder from '../../../../assets/307ce493-b254-4b2d-8ba4-d12c080d6651.jpg';
export interface CardProps {
    id?: string;
    title: string;
    subtitle?: string;
    meta?: React.ReactNode;
    imageSrc?: string;
    imageAlt?: string;
    isSelected?: boolean;
    onClick?: (id?: string) => void;
    className?: string;
}

export const Card: React.FC<CardProps> = ({
    id,
    title,
    subtitle,
    meta,
    imageSrc,
    imageAlt,
    isSelected,
    onClick,
    className = '',
}) => {
    const rootClass = `card ${isSelected ? 'shadow-xl ring-4 ring-accent/20' : 'hover:shadow-md'} ${className}`;

    return (
        <article className={rootClass} onClick={() => onClick?.(id)} role="button">
            <div className="card-body p-3">
                <div className="flex items-center gap-4">
                    <div className="avatar">
                        <div className="w-12 bg-neutral-300 flex items-center justify-center">
                            <img
                                src={imageSrc ?? logoPlaceholder}
                                alt={imageAlt ?? title}
                                className="object-cover rounded"
                            />
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <p className="text-base font-bold text-base-content">{title}</p>
                            {meta ? <div className="text-xs text-base-content/60">{meta}</div> : null}
                        </div>
                        {subtitle ? <p className="text-sm text-base-content/70">{subtitle}</p> : null}
                    </div>
                </div>
            </div>
        </article>
    );
};

export default Card;
