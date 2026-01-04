import './App.css';
import { createBrowserRouter, redirect, RouterProvider, Navigate } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompanySignup } from './auth/companySignup/index';
import { Login } from './auth/Login/index';
import { CompleteProfil } from './company/completeProfil/index';
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
import { CompanyForumRoute } from './protectedRoutes/companyForumRoute';
import { InternshipPage } from './pages/internship/InternshipPage';
import InternshipDetailPage from './pages/internship/InternshipDetailPage';
import CreatePostPage from './pages/posts/CreatePostPage';
import UpdatePostPage from './pages/posts/UpdatePostPage';
import { updatePostLoader } from './loaders/updatePostLoader';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { InternshipApply } from './pages/internship/InternshipApply';
import { DarkModeProvider } from './components/darkMode/DarkModeProvider';
import MainLayout from './components/layout/MainLayout';
import TermsOfUse from './pages/legal/TermsOfUse';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import CookiePolicy from './pages/legal/CookiePolicy';
import SafetyCompliance from './pages/legal/SafetyCompliance';
import About from './pages/legal/About';
import Contact from './pages/legal/Contact';
import FAQ from './pages/legal/FAQ';
import Help from './pages/legal/Help';
import { internshipLoader } from './loaders/intershipLoader';
import { AdminDashboard } from './admin/dashboard';
import ApplicationPage from './pages/applications/ApplicationPage';
import ApplicationDetailPage from './pages/applications/ApplicationDetailPage';
import { StudentDashboard } from './student/dashboard';
import { ChangePassword as StudentChangePassword } from './student/changePassword';
import { ApplicationList } from './company/dashboard/applicationList/ApplicationList.tsx';
import { ApplicationList } from './company/applicationList/ApplicationList.tsx';
import ImportStudent from './admin/importStudent.tsx';
import TopicDetailPage from './pages/forum/TopicDetailPage';
import { MainForumPage } from './pages/forums/MainForumPage.tsx';
import { ForumPage } from './pages/forums/ForumPage.tsx';

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
                                    element: <VerifiedRoutes redirectPath="/company/dashboard" />,
                                    children: [],
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
                                    index: true,
                                    element: <VerifiedRoutes redirectPath="/" />,
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
                                {
                                    path: ':id',
                                    element: <ProtectedRoutesByRole allowedRoles={['COMPANY']} />,
                                    children: [
                                        {
                                            index: true,
                                            element: <VerifiedRoutes redirectPath="/" />,
                                        },
                                        { path: 'applications', element: <ApplicationList /> },
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
                            path: 'student',
                            element: <ProtectedRoutesByRole allowedRoles={['STUDENT']} redirectPath="/" />,
                            children: [
                                {
                                    path: 'change-password',
                                    element: <StudentChangePassword />,
                                    handle: { title: 'Changer le mot de passe' },
                                },
                                {
                                    path: 'dashboard',
                                    element: <StudentDashboard />,
                                    children: [
                                        { index: true, element: <ApplicationPage /> },
                                        { path: ':applicationId', element: <ApplicationDetailPage /> },
                                    ],
                                },
                            ],
                        },
                        {
                            path: 'applications',
                            element: <Navigate to="/student/dashboard" replace />,
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
