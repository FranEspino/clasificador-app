import React from 'react';
import  ReactDOM  from 'react-dom/client';
import './index.css'
import App from './App'
import CounterApp from './components/CounterApp';
import Clasificador from './components/Clasificador';
const root = ReactDOM.createRoot( document.querySelector("#root"))
root.render(
    <React.StrictMode>
        <Clasificador />
    </React.StrictMode>
)

