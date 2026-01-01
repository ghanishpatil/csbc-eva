import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ConfigValidator } from './components/ConfigValidator';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigValidator>
      <App />
    </ConfigValidator>
  </React.StrictMode>
);

