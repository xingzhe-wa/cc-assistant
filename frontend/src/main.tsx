import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// JCEF 集成 - 在 React 初始化前注入全局对象
import './lib/jcef-integration';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
