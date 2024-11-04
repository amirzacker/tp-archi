import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './index.css';
import HomePage from './pages/HomePage';
import SuccessPage from './pages/SuccessPage';
import DashboardPage from './pages/DashboardPage';
import PaymentDetailsPage from './pages/PaymentDetailsPage';
import reportWebVitals from './reportWebVitals';
import FailurePage from './pages/FailurePage'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" exact element={<HomePage/>} />
        <Route path="/success" element={<SuccessPage/>} />
        <Route path="/dashboard" element={<DashboardPage/>} />
        <Route path="/payment/:id" element={<PaymentDetailsPage/>} />
        <Route path="/failure" element={<FailurePage/>} /> 
      </Routes>
    </Router>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
