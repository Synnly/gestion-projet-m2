import './App.css';
import { createBrowserRouter, Outlet } from 'react-router';
import { RouterProvider } from 'react-router';
import { CompanySignup } from './auth/companySignup/index';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Login } from './auth/Login/index';
import { CompleteProfil } from './company/completeProfil/index';
import { protectedMiddleware } from './middleware/protectAuthMiddleware';
import { completeProfilMiddleware } from './middleware/completeProfilMiddleware';
import { notAuthMiddleWare } from './middleware/notAuthMiddleware';
import { VerifyEmail } from './user/verifyMail';
import { userStore } from './store/userStore';
import { ForgotPassword } from './user/ForgotPassword';
import { ProtectedRoutesByRole } from './protectedRoutes/protectedRouteByRole';
import { AuthRoutes } from './protectedRoutes/authRoutes/authRoutes';
import { VerifiedRoutes } from './protectedRoutes/verifiedRoute';
import CreatePostPage from "./pages/posts/CreatePostPage";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
    userStore.persist.rehydrate();
    const queryClient = new QueryClient();
    // Replace the code below with your own components
    const route = [
        {
            path: '/',
            id: 'root',
            middleware: [completeProfilMiddleware],
            element: <Outlet />,
            children: [
                {
                    loader: notAuthMiddleWare,
                    children: [
                        { index: true, element: <div>Hello World</div> },
                        { path: 'signin', element: <Login /> },
                        { path: 'forgot-password', element: <ForgotPassword /> },
                        { path: 'company/signup', element: <CompanySignup /> },
                    ],
                },
                {
                    loader: protectedMiddleware,
                    element: <AuthRoutes />,
                    children: [
                        { path: 'verify', element: <VerifyEmail /> },
                        { path: 'complete-profil', element: <CompleteProfil /> },
                        {
                            path: 'company',
                            element: <ProtectedRoutesByRole allowedRoles={['COMPANY']} />,
                            children: [
                                { path: 'dashboard', element: <div>Company Dashboard</div> },
                                { path: 'projects', element: <div>Company Projects</div> },
                                {
                                    element: <VerifiedRoutes redirectPath="/company/dashboard" />,
                                    children: [],
                                },
                                { path: '/company/offers/add', element: <CreatePostPage /> },
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
            <ToastContainer position="top-right" theme="light" />
        </QueryClientProvider>
    );
}

export default App;
