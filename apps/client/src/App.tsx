import './App.css';
import { createBrowserRouter, Outlet, redirect, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider, dehydrate } from '@tanstack/react-query';
import { ToastProvider } from './components/ui/toast/ToastProvider';
import { fetchInternshipById } from './hooks/useFetchInternships';
import { CompanySignup } from './auth/companySignup/index';
import { Login } from './auth/Login/index';
import { CompleteProfil } from './company/completeProfil/index';
import { CompanyDashboard } from './company/dashboard/index';
import { CompanyProfile } from './company/profile/index';
import { EditCompanyProfile } from './company/editProfile/index';
import { ChangePassword } from './company/editProfile/changePassword/index';
import { protectedMiddleware } from './middleware/protectAuthMiddleware';
import { completeProfilMiddleware } from './middleware/completeProfilMiddleware';
import { notAuthMiddleWare } from './middleware/notAuthMiddleware';
import { VerifyEmail } from './user/verifyMail';
import { userStore } from './store/userStore';
import { ForgotPassword } from './user/ForgotPassword';
import { ProtectedRoutesByRole } from './protectedRoutes/protectedRouteByRole';
import { AuthRoutes } from './protectedRoutes/authRoutes/authRoutes';
import { VerifiedRoutes } from './protectedRoutes/verifiedRoute';
import { InternshipPage } from './pages/internship/InternshipPage';
import InternshipDetailPage from './pages/internship/InternshipDetailPage';
import { DashboardInternshipList } from './company/dashboard/intershipList/DashboardInternshipList';

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
                    path: 'logout',
                    loader: () => {
                        userStore.getState().logout();
                        return redirect('/signin');
                    },
                },

                { index: true, element: <InternshipPage /> },
                {
                    loader: notAuthMiddleWare,
                    children: [
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
                                {
                                    path: 'dashboard',
                                    element: <CompanyDashboard />,
                                    children: [
                                        {
                                            path: 'internships',
                                            element: <DashboardInternshipList />,
                                        },
                                    ],
                                },
                                { path: 'profile', element: <CompanyProfile /> },
                                { path: 'profile/edit', element: <EditCompanyProfile /> },
                                { path: 'profile/change-password', element: <ChangePassword /> },
                                { path: 'projects', element: <div>Company Projects</div> },
                                {
                                    element: <VerifiedRoutes redirectPath="/company/dashboard" />,
                                    children: [],
                                },
                            ],
                        },
                        {
                            path: 'internship',
                            element: <ProtectedRoutesByRole allowedRoles={['USER', 'ADMIN', 'COMPANY']} />,
                            children: [
                                {
                                    element: <VerifiedRoutes redirectPath="/" />,
                                    children: [
                                        {
                                            path: 'detail/:id',
                                            element: <InternshipDetailPage />,
                                            loader: async ({ params }: any) => {
                                                const id = params?.id;
                                                if (!id) throw new Response('Missing id', { status: 400 });
                                                const qc = new QueryClient();
                                                try {
                                                    await qc.fetchQuery({
                                                        queryKey: ['internship', id],
                                                        queryFn: () => fetchInternshipById(id),
                                                    });
                                                } catch (e) {
                                                    throw new Response('Not found', { status: 404 });
                                                }

                                                return { id, dehydratedState: dehydrate(qc) };
                                            },
                                        },
                                    ],
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
            <ToastProvider>
                <RouterProvider router={router} />
            </ToastProvider>
        </QueryClientProvider>
    );
}

export default App;
