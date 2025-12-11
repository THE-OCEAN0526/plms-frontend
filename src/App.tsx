// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeContextProvider } from './context/ThemeContext'; // 引入 Context

// 引入頁面與 Layout
import Login from './pages/Login';
import Inventory from './pages/Inventory';
import Dashboard from './pages/Dashboard';
import MainLayout from './components/MainLayout';
import AssetCreate from './pages/AssetCreate';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('plms_token');
  if (!token) return <Navigate to="/" replace />;
  return <MainLayout>{children}</MainLayout>;
};

function App() {
  return (
    // ★ 這裡包裹 Context，讓裡面的所有組件都能存取樣式設定
    <ThemeContextProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />

          <Route path="/asset/create" element={
            <ProtectedRoute><AssetCreate /></ProtectedRoute>
          } />

          <Route path="/inventory" element={
            <ProtectedRoute><Inventory /></ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeContextProvider>
  );
}

export default App;