import React from'react';
import{createRoot}from'react-dom/client';
import App from'./App.jsx';
import'./styles.css';
import'./dashboard.css';
import'./stabilization.css';
import'./v2-shell.css';
import'./v2-rail.css';

createRoot(document.getElementById('root')).render(<App/>);
