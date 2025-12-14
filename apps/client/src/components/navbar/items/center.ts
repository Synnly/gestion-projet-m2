import type { NavItem } from './types';

export const centerNavItems: NavItem[] = [
    {
        key: 'home-company',
        title: 'TABLEAU DE BORD',
        to: '/company/dashboard',
        type: 'link',
        role: ['COMPANY'],
    },
    {
        key: 'home-student',
        title: 'TABLEAU DE BORD',
        to: '/student/dashboard',
        type: 'link',
        role: ['STUDENT'],
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
