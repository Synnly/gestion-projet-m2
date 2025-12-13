import './App.css';
import { createBrowserRouter, redirect, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
import CreatePostPage from './pages/posts/CreatePostPage';
import UpdatePostPage from './pages/posts/UpdatePostPage';
import { updatePostLoader } from './loaders/updatePostLoader';
import { DashboardInternshipList } from './company/dashboard/intershipList/DashboardInternshipList';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { InternshipApply } from './pages/internship/InternshipApply';
import { DarkModeProvider } from './components/darkMode/DarkModeProvider';
import { MainLayout } from './pages/layout/MainLayout';
import { internshipLoader } from './loaders/intershipLoader';
import ApplicationPage from './pages/applications/ApplicationPage';
import ApplicationDetailPage from './pages/applications/ApplicationDetailPage';

function App() {
    userStore.persist.rehydrate();
    const queryClient = new QueryClient();
    const route = [
        {
            path: '/',
            id: 'root',
            middleware: [completeProfilMiddleware],
            element: <MainLayout />,
            children: [
                {
                    path: 'logout',
                    loader: () => {
                        userStore.getState().logout();
                        return redirect('/signin');
                    },
                },

                { index: true, element: <InternshipPage />, handle: { title: 'Accueil' } },
                {
                    loader: notAuthMiddleWare,
                    children: [
                        { path: 'signin', element: <Login />, handle: { title: 'Connectez-vous' } },
                        {
                            path: 'forgot-password',
                            element: <ForgotPassword />,
                            handle: { title: 'Mot de passe oublié' },
                        },
                        {
                            path: 'company/signup',
                            element: <CompanySignup />,
                            handle: { title: 'Inscription entreprise' },
                        },
                    ],
                },
                {
                    loader: protectedMiddleware,
                    element: <AuthRoutes />,
                    children: [
                        { path: 'verify', element: <VerifyEmail />, handle: { title: 'Vérifier votre mail' } },
                        {
                            path: 'complete-profil',
                            element: <CompleteProfil />,
                            handle: { title: 'Compléter votre profil' },
                        },
                        {
                            path: 'company',
                            element: <ProtectedRoutesByRole allowedRoles={['COMPANY']} />,
                            children: [
                                {
                                    path: 'dashboard',
                                    handle: { title: 'Tableau de bord entreprise' },
                                    element: <CompanyDashboard />,
                                    children: [
                                        {
                                            index: true,
                                            element: <DashboardInternshipList />,
                                        },
                                    ],
                                },
                                {
                                    path: 'profile',
                                    element: <CompanyProfile />,
                                    handle: { title: "Profil de l'entreprise" },
                                },
                                {
                                    path: 'profile/edit',
                                    element: <EditCompanyProfile />,
                                    handle: { title: 'Éditer le profil' },
                                },
                                {
                                    path: 'profile/change-password',
                                    element: <ChangePassword />,
                                    handle: { title: 'Changer le mot de passe' },
                                },
                                {
                                    element: <VerifiedRoutes redirectPath="/company/dashboard" />,
                                    children: [],
                                },
                                {
                                    path: 'offers/add',
                                    element: <CreatePostPage />,
                                    handle: { title: 'Créer une offre' },
                                },
                                {
                                    path: 'offers/:postId/edit',
                                    loader: updatePostLoader,
                                    element: <UpdatePostPage />,
                                    handle: { title: 'Modifier une offre' },
                                },
                            ],
                        },
                        {
                            path: 'internship',
                            children: [
                                {
                                    element: <VerifiedRoutes redirectPath="/" />,
                                    children: [],
                                },

                                {
                                    path: 'detail/:id',
                                    element: <InternshipDetailPage />,
                                    loader: internshipLoader,
                                },
                                {
                                    element: <ProtectedRoutesByRole allowedRoles={['STUDENT']} />,
                                    children: [
                                        {
                                            path: 'apply/:postId',
                                            element: <InternshipApply />,
                                        },
                                    ],
                                    handle: { title: 'Postuler à un stage' },
                                },
                            ],
                        },
                        {
                            path: 'applications',
                            element: <ProtectedRoutesByRole allowedRoles={['STUDENT', 'ADMIN']} redirectPath="/" />,
                            children: [
                                {
                                    children: [
                                        { index: true, element: <ApplicationPage /> },
                                        { path: ':applicationId', element: <ApplicationDetailPage /> },
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
            <DarkModeProvider>
                <RouterProvider router={router} />
                <ToastContainer position="top-right" theme="light" />
            </DarkModeProvider>
        </QueryClientProvider>
    );
}

export default App;
