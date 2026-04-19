import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/common';
// JCEF 集成 - 在 React 初始化前注入全局对象
import './lib/jcef-integration';

const app = (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  import.meta.env.DEV ? <React.StrictMode>{app}</React.StrictMode> : app
);
