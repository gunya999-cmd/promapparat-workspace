import React from'react';
import{createRoot}from'react-dom/client';
import App from'./App.jsx';
import'./styles.css';
import'./dashboard.css';
import'./stabilization.css';
import'./v2-shell.css';
import'./v2-rail.css';
import'./tender-command.css';
import'./opportunities.css';
import'./opportunity-route.css';
import'./opportunity-sheet.css';
import'./director.css';
import'./director-finance.css';
import'./r4-manager.css';

createRoot(document.getElementById('root')).render(<App/>);
