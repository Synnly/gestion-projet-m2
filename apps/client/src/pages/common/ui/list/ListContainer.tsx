import React from 'react';

export interface ListContainerProps {
    children: React.ReactNode;
    className?: string;
    colClass?: string;
}

export const ListContainer: React.FC<ListContainerProps> = ({
    children,
    className = '',
    colClass = 'h-full overflow-hidden col-span-12 lg:col-span-5',
}) => {
    return (
        <div className={`${colClass} ${className}`}>
            <div className="h-full overflow-hidden card bg-base-100 p-3">
                <div className="h-full overflow-hidden flex flex-col gap-3">{children}</div>
            </div>
        </div>
    );
};

export default ListContainer;
