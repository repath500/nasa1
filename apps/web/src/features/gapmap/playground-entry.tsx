import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../design/tokens.css';
import Playground from './Playground';

createRoot(document.getElementById('root')!).render(<React.StrictMode><Playground /></React.StrictMode>);
