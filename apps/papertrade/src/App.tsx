import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes';

const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL || '/',
});

export default function App() {
  return <RouterProvider router={router} />;
}
