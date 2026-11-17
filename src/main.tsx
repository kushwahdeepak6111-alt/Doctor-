import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof document !== 'undefined') {
  document.addEventListener('touchstart', () => {}, { passive: true });
}

createRoot(document.getElementById('root')!).render(<App />);
