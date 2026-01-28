import React from 'react';
import ReactDOM from 'react-dom/client';
import TaxCalculator from './TaxCalculator';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Missing #root element');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <TaxCalculator />
  </React.StrictMode>,
);
