import { createRoot } from 'react-dom/client';
import './i18n';
import './styles.css';
import { App } from './ui/App';

const root = document.getElementById('root');
if (root) createRoot(root).render(<App />);
