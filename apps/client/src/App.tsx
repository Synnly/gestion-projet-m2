import './App.css';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router';
import { CompanySignup } from './auth/companySignup/index';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthRoutes } from './authRoutes/index';
import { ProtectedRoutesByRole } from './authRoutes/protectedRouteByRole';
import { Login } from './auth/Login/index';
import { VerifiedRoutes } from './authRoutes/verifiedRoute';
import { CompleteProfil } from './company/completeProfil/index';
import { protectedLoader } from './loader/protectAuthLoader';
import { completeProfilLoader } from './loader/completeProfilLoader';
import { notAuthLoader } from './loader/notAuthLoader';

function App() {
    const queryClient = new QueryClient();
    // Replace the code below with your own components
    const route = [
        {
            loader: completeProfilLoader,
            children: [
                {
                    loader: notAuthLoader,
                    children: [
                        {
                            path: '/',
                            element: <div>Hello World</div>,
                        },
                        {
                            path: '/signin',
                            element: <Login />,
                        },
                        {
                            path: '/company/signup',
                            element: <CompanySignup />,
                        },
                    ],
                },
                {
                    loader: protectedLoader,
                    element: <AuthRoutes />,
                    children: [
                        {
                            path: '/verify',
                            element: <div>verify</div>,
                        },
                        {
                            path: '/complete-profil',
                            element: <CompleteProfil />,
                        },
                        {
                            path: '/company',
                            element: <ProtectedRoutesByRole allowedRoles={['COMPANY']} />,
                            children: [
                                {
                                    path: '/company/dashboard',
                                    element: <div>Company Dashboard</div>,
                                },
                                {
                                    element: <VerifiedRoutes redirectPath="/company/dashboard" />,
                                    children: [],
                                },
                            ],
                        },
                    ],
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
