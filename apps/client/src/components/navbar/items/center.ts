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
        title: 'Annonces',
        to: '/internships/list',
        type: 'link',
    },
    {
        key: 'applications',
        title: 'Candidatures',
        to: '/company/applications',
        type: 'link',
    },
];
