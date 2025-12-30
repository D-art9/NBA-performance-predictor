import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './App';
import Home from './Home';
import About from './About';
import DataFlow from './DataFlow';
import Results from './Results';
import InitialLoader from './InitialLoader';
import reportWebVitals from './reportWebVitals';

// Log API base URL at startup for debugging
console.log("API BASE URL =", import.meta.env.VITE_API_BASE_URL);

const AppWrapper = () => {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <InitialLoader onComplete={() => setIsLoading(false)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/about" element={<About />} />
        <Route path="/data-flow" element={<DataFlow />} />
        <Route path="/results" element={<Results />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
