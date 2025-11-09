import './App.css';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router';
import { CompanySignUp } from './companySignup';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthRoutes } from './authRoutes/index'; 
import { CompanyRoute } from './authRoutes/companyRoute';
function App() {
    const queryClient = new QueryClient();
    // Replace the code below with your own components
    const route = [
        {
            path: '/',
            element: <div>Hello World</div>,
        },
        {
            path: '/company/signup',
            element: <CompanySignUp />,
        },
        {
            path: '/signin',
            element: <h1>Sign Up Page</h1>,
        },
        {
            element:<AuthRoutes />,
            children:[
                {
                    element:<CompanyRoute />
                }
            ]
        }
    ];
    const router = createBrowserRouter(route);
    return (
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    );
}

export default App;
