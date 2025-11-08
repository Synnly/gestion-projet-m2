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
            path: '/company/signup',
            element: <CompanySignUp />,
        },
        {
            path: '/signin',
            element: <h1>Sign Up Page</h1>,
        },
    ];
    const router = createBrowserRouter(route);
    return <RouterProvider router={router} />;
}

export default App;
