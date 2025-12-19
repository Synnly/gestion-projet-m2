import React from 'react';
import { NavLink } from 'react-router';
import type { NavItem } from './types';
export { centerNavItems } from './center';
export { rightNavItems } from './right';

export interface ItemLinkProps {
    item: NavItem;
    className?: string;
}

export const ItemLink: React.FC<ItemLinkProps> = ({ item, className }) => (
    <NavLink
        to={item.to ?? '#'}
        className={({ isActive }) => {
            const baseClasses = className ?? item.className ?? 'btn btn-ghost transition-colors';
            return isActive && item.to !== '/' ? `${baseClasses}` : `${baseClasses}`;
        }}
    >
        {item.title}
    </NavLink>
);

export default ItemLink;
