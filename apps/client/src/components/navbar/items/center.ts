import type { NavItem } from './types';

export const centerNavItems: NavItem[] = [
    {
        key: 'home',
        title: 'Tableau de bord',
        to: '/company/dashboard',
        type: 'link',
        role: ['COMPANY'],
    },
    /*{
        key: 'offers',
        title: 'Annonces',
        to: '/company/dashboard/internships',
        type: 'link',
        role: ['COMPANY'],
    },
      {
        key: 'applications',
        title: 'Candidatures',
        to: '/company/applications',
        type: 'link',
        role: ['COMPANY'],
    },*/
];
