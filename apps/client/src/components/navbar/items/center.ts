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
        title: 'OFFRES DE STAGE',
        to: '/',
        type: 'link',
        role: ['STUDENT'],
    },
    {
        key: 'dashboard-student',
        title: 'MES CANDIDATURES',
        to: '/student/dashboard',
        type: 'link',
        role: ['STUDENT'],
    },
    {
        key: 'home-admin',
        title: 'TABLEAU DE BORD',
        to: '/admin/dashboard',
        type: 'link',
        role: ['ADMIN'],
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
