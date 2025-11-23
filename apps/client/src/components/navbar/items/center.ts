import type { NavItem } from './types';

export const centerNavItems: NavItem[] = [
    {
        key: 'offers',
        title: 'Les annonces',
        to: '/company/offers',
        type: 'link',
    },
    {
        key: 'applications',
        title: 'Les candidatures',
        to: '/company/applications',
        type: 'link',
    },
];
