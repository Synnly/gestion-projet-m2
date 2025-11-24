import type React from 'react';

export type NavItemType = 'link' | 'button' | 'dropdown';

export interface NavItem {
    key: string;
    title: React.ReactNode;
    to?: string;
    role?: 'COMPANY' | 'STUDENT' | 'GUEST';
    type?: NavItemType;
    className?: string;
    children?: NavItem[];
}
