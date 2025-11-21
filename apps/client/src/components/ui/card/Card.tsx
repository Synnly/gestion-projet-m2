import React from 'react';

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
  className = ''
}) => {
  const cardClasses = isSelected
    ? 'cursor-pointer rounded-xl border-2 border-accent bg-base-100 p-4 shadow-md ring-4 ring-accent/20'
    : 'cursor-pointer rounded-xl border border-base-300 bg-base-100 p-4 transition-all hover:shadow-md';

  return (
    <div className={`${cardClasses} ${className}`} onClick={() => onClick?.(id)}>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-neutral">
          {imageSrc ? <img alt={imageAlt ?? title} className="h-7 w-7" src={imageSrc} /> : null}
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
  );
};

export default Card;
