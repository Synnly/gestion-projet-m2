import './App.css';
import { createBrowserRouter, redirect, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Login } from './pages/auth/Login';
import { CompanySignup } from './pages/auth/companySignup';
import { protectedMiddleware } from './middlewares/protectAuthMiddleware';
import { completeProfilMiddleware } from './middlewares/completeProfilMiddleware';
import { notAuthMiddleWare } from './middlewares/notAuthMiddleware';
import { VerifyEmail } from './pages/user/VerifyMail';
import { ForgotPassword } from './pages/user/ForgotPasword';
import { ProtectedRoutesByRole } from './routings/protectedRouteByRole/ProtectedRouteByRole';
import { AuthRoutes } from './routings/authRoutes/authRoutes';
import { VerifiedRoutes } from './routings/verifiedRoute/VerifiedRoute';
import { CompanyForumRoute } from './routings/companyForumRoute/CompanyForumRoute';
import { InternshipPage } from './pages/internships/InternshipPage';
import InternshipDetailPage from './pages/internships/InternshipDetailPage';
import CreatePostPage from './pages/posts/CreatePostPage';
import UpdatePostPage from './pages/posts/UpdatePostPage';
import { updatePostLoader } from './middlewares/updatePostLoader';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { InternshipApply } from './pages/internships/InternshipApply';
import TermsOfUse from './pages/legal/TermsOfUse';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import CookiePolicy from './pages/legal/CookiePolicy';
import SafetyCompliance from './pages/legal/SafetyCompliance';
import About from './pages/legal/About';
import Contact from './pages/legal/Contact';
import FAQ from './pages/legal/FAQ';
import Help from './pages/legal/Help';
import { internshipLoader } from './middlewares/intershipLoader';
import { MainForumPage } from './pages/forums/MainForumPage';
import { ForumPage } from './pages/forums/ForumPage';
import LandingPage from './pages/landing-page/LandingPage';
import { PendingValidation } from './pages/company/PendingValidation';
import ImportStudent from './pages/admin/components/importStudent';
import { AdminDashboard } from './pages/admin/dashboard';
import { DarkModeProvider } from './pages/common/darkMode/DarkModeProvider';
import { ApplicationList } from './pages/company/ApplicationList';
import { CompleteProfil } from './pages/company/CompleteProfil';
import { EditCompanyProfile } from './pages/company/EditProfile';
import { CompanyProfile } from './pages/company/Profile';
import TopicDetailPage from './pages/forums/TopicDetailPage';
import { MainLayout } from './pages/layout/MainLayout';
import { ChangePassword } from './pages/student/components/ChangePassword';
import { userStore } from './stores/userStore';
import { EditStudentProfile } from './pages/student/EditStudentProfile';
import { PublicStudentProfile } from './pages/student/PublicStudentProfile';
import { StudentProfile } from './pages/student/StudentProfile';
import { AccountRestorePage } from './pages/auth/AccountRestorePage';
import { NotFound } from './pages/common/status/NotFound';

const VITE_API = import.meta.env.VITE_APIURL;

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
                    loader: async () => {
                        userStore.getState().logout();
                        await fetch(`${VITE_API}/api/auth/logout`, { method: 'POST', credentials: 'include' });
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

                {
                    loader: notAuthMiddleWare,
                    children: [
                        { index: true, element: <LandingPage />, handle: { title: 'Accueil - Stagora' } },
                        { path: 'signin', element: <Login />, handle: { title: 'Connectez-vous' } },
                        {
                            path: 'forgot-password',
                            element: <ForgotPassword />,
                            handle: { title: 'Mot de passe oublié' },
                        },
                        {
                            path: '/company/signup',
                            element: <CompanySignup />,
                            handle: { title: 'Inscription entreprise' },
                        },
                    ],
                },
                {
                    loader: protectedMiddleware,
                    element: <AuthRoutes />,
                    children: [
                        { 
                            path: 'account-restore', 
                            element: <AccountRestorePage />, 
                            handle: { title: 'Restaurer votre compte' } 
                        },
                        { path: 'verify', element: <VerifyEmail />, handle: { title: 'Vérifier votre mail' } },
                        { path: 'home', element: <InternshipPage />, handle: { title: 'Accueil' } },

                        {
                            path: 'pending-validation',
                            element: <PendingValidation />,
                            handle: { title: 'Compte en cours de validation' },
                        },
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
                                    element: <ChangePassword subtitle={''} isFirstTime={false} />,
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
                            path: 'student',
                            element: <ProtectedRoutesByRole allowedRoles={['STUDENT']} />,
                            children: [
                                {
                                    path: 'profile',
                                    children: [
                                        {
                                            index: true,
                                            element: <StudentProfile />,
                                            handle: { title: 'Profil étudiant' },
                                        },
                                        {
                                            path: 'edit',
                                            element: <EditStudentProfile />,
                                            handle: { title: 'Éditer le profil' },
                                        },
                                        {
                                            path: 'change-password',
                                            element: (
                                                <ChangePassword
                                                    subtitle="Choisissez un nouveau mot de passe sécurisé"
                                                    isFirstTime={false}
                                                />
                                            ),
                                            handle: { title: 'Changer le mot de passe' },
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            path: 'student/public/:studentId',
                            element: <PublicStudentProfile />,
                            handle: { title: 'Profil étudiant' },
                        },
                        {
                            path: 'internship',
                            children: [
                                {
                                    index: true,
                                    element: <VerifiedRoutes redirectPath="/home" />,
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
                                            element: <VerifiedRoutes redirectPath="/home" />,
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
                                    path: 'changePassword',
                                    element: (
                                        <ChangePassword
                                            subtitle="Pour des raisons de sécurité, vous devez changer votre mot de passe lors de votre première
                                                            connexion."
                                            isFirstTime={true}
                                        />
                                    ),
                                    handle: { title: 'Changer le mot de passe' },
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
                {
                    path: '*',
                    element: <NotFound />,
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
