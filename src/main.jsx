import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import axios from "axios";

axios.interceptors.request.use((config) => {
  console.log("🚀 Axios request:", config.method.toUpperCase(), config.url);
  return config;
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
