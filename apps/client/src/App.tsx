import './App.css';
import { createBrowserRouter, redirect, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompanySignup } from './pages/signup/signup';
import { Login } from './pages/login/login';
import { CompleteProfil } from './pages/company/completeProfil';
import { CompanyProfile } from './pages/company/profile';
import { EditCompanyProfile } from './pages/company/editProfile';
import { ChangePassword } from './pages/company/changePassword';
import { protectedMiddleware } from './middlewares/protectAuthMiddleware';
import { completeProfilMiddleware } from './middlewares/completeProfilMiddleware';
import { notAuthMiddleWare } from './middlewares/notAuthMiddleware';
import { VerifyEmail } from './pages/verifyMail/verifyMail';
import { userStore } from './stores/userStore';
import { ForgotPassword } from './pages/forgotPassword/forgotPassword';
import { ProtectedRoutesByRole } from './protectedRoutes/protectedRouteByRole';
import { AuthRoutes } from './protectedRoutes/authRoutes/authRoutes';
import { VerifiedRoutes } from './protectedRoutes/verifiedRoute';
import { CompanyForumRoute } from './protectedRoutes/companyForumRoute';
import { InternshipPage } from './pages/internship/InternshipPage';
import InternshipDetailPage from './pages/internship/InternshipDetailPage';
import CreatePostPage from './pages/internship/CreatePostPage';
import UpdatePostPage from './pages/internship/UpdatePostPage';
import { updatePostLoader } from './middlewares/updatePostLoader';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { InternshipApply } from './pages/internship/InternshipApply';
import { DarkModeProvider } from './pages/common/darkMode/DarkModeProvider';
import MainLayout from './pages/common/layout/MainLayout';
import TermsOfUse from './pages/legal/TermsOfUse';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import CookiePolicy from './pages/legal/CookiePolicy';
import SafetyCompliance from './pages/legal/SafetyCompliance';
import About from './pages/legal/About';
import Contact from './pages/legal/Contact';
import FAQ from './pages/legal/FAQ';
import Help from './pages/legal/Help';
import { internshipLoader } from './middlewares/intershipLoader';
import { AdminDashboard } from './pages/admin/dashboard';
import ImportStudent from './pages/admin/importStudent.tsx';
import TopicDetailPage from './pages/forum/TopicDetailPage';
import { MainForumPage } from './pages/forum/MainForumPage.tsx';
import { ForumPage } from './pages/forum/ForumPage.tsx';

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

                { path: 'about', element: <About /> },
                { path: 'contact', element: <Contact /> },
                { path: 'faq', element: <FAQ /> },
                { path: 'help', element: <Help /> },
                { path: 'terms', element: <TermsOfUse /> },
                { path: 'privacy', element: <PrivacyPolicy /> },
                { path: 'cookies', element: <CookiePolicy /> },
                { path: 'safety', element: <SafetyCompliance /> },
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
                                    path: 'offers/add',
                                    element: <CreatePostPage />,
                                    handle: { title: 'Créer une offre' },
                                },
                            ],
                        },
                        {
                            path: 'internship',
                            children: [
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
                                {
                                    path: ':id',
                                    element: <ProtectedRoutesByRole allowedRoles={['COMPANY']} />,
                                    children: [
                                        {
                                            index: true,
                                            element: <VerifiedRoutes redirectPath="/" />,
                                        },
                                        {
                                            path: 'edit',
                                            loader: updatePostLoader,
                                            element: <UpdatePostPage />,
                                            handle: { title: 'Modifier une offre' },
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            path: 'admin',
                            element: <ProtectedRoutesByRole allowedRoles={['ADMIN']} />,
                            children: [
                                {
                                    path: 'dashboard',
                                    element: <AdminDashboard />,
                                    handle: { title: 'Tableau de bord admin' },
                                    children: [{ index: true, element: <ImportStudent /> }],
                                },
                            ],
                        },
                        {
                            path: 'forums',
                            children: [
                                { index: true, element: <MainForumPage /> },
                                {
                                    path: 'general',

                                    children: [
                                        { index: true, element: <ForumPage isGeneral={true} /> },
                                        { path: 'topics/:forumId/:topicId/', element: <TopicDetailPage /> },
                                    ],
                                },
                                {
                                    path: ':companyId',
                                    element: <CompanyForumRoute />,
                                    children: [
                                        { index: true, element: <ForumPage /> },
                                        { path: 'topics/:forumId/:topicId', element: <TopicDetailPage /> },
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
