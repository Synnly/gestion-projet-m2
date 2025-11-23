import type { NavItem } from './types';

export const centerNavItems: NavItem[] = [
    {
        key: 'home',
        title: 'Tableau de bord',
        to: '/',
        type: 'link',
    },
    {
        key: 'offers',
        title: 'Les annonces',
        to: '/internships/list',
        type: 'link',
    },
    {
        key: 'applications',
        title: 'Les candidatures',
        to: '/company/applications',
        type: 'link',
    },
];
