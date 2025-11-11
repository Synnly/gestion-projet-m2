<<<<<<< HEAD
import './App.css';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router';
import { CompanySignUp } from './authCompany/companySignup';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthRoutes } from './authRoutes/index';
import { ProtectedRouteByRole } from './authRoutes/protectedRouteByRole';
import { AuthCompany } from './authCompany/index';
import { CompanyLogin } from './authCompany/companyLogin';
function App() {
    const queryClient = new QueryClient();
=======
import { useState } from 'react';
import './App.css';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router';
import { CompanySignUp } from './components/CompanySignup';

function App() {
    // Replace the code below with your own components
    const route = [
        {
            path: '/',
            element: <div>Hello World</div>,
        },
        {
            element: <AuthCompany />,
            children: [
                {
                    path: '/company/signup',
                    element: <CompanySignUp />,
                },
                {
                    path: '/company/signin',
                    element: <CompanyLogin />,
                },
            ],
        },
        {
            element: <AuthRoutes />,
            children: [
                {
                    element: <ProtectedRouteByRole allowedRoles={['COMPANY']} />,
                },
            ],
        },
    ];
    const router = createBrowserRouter(route);
    return (
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    );
}

export default App;
