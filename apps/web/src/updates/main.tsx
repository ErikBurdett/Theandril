import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Journal } from './Journal';
import './journal.css';

createRoot(document.getElementById('root')!).render(<StrictMode><Journal /></StrictMode>);
