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
            const baseClasses = className ?? item.className ?? 'btn transition-colors';
            return isActive ? `${baseClasses}` : (item.key !== 'addOffer' ? `btn-ghost ${baseClasses}` : `${baseClasses}`);
        }}
    >
        {item.title}
    </NavLink>
);

export default ItemLink;
