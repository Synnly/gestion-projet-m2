import type { NavItem } from './types';

export const centerNavItems: NavItem[] = [
    {
        key: 'forums',
        title: 'FORUMS',
        to: '/forums',
        type: 'link',
        role: ['ADMIN', 'STUDENT', 'COMPANY'],
    },
    {
        key: 'info-company',
        title: 'MA PAGE',
        to: '/company/my-page',
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
        key: 'home-admin',
        title: 'ADMINISTRATION',
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
