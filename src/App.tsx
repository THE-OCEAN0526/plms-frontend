import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 引入頁面與 Layout
import Login from './pages/Login';
import Inventory from './pages/Inventory';
import Dashboard from './pages/Dashboard';
import MainLayout from './components/MainLayout';
import AssetCreate from './pages/AssetCreate';

// 保護路由：負責權限檢查
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('plms_token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  // 驗證通過，回傳被 MainLayout 包裹的內容
  return <MainLayout>{children}</MainLayout>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 登入頁 (不套用 MainLayout) */}
        <Route path="/" element={<Login />} />
        
        {/* 功能頁面 (受保護 + 自動套用 MainLayout) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/asset/create" 
          element={
            <ProtectedRoute>
              <AssetCreate />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/inventory" 
          element={
            <ProtectedRoute>
              <Inventory />
            </ProtectedRoute>
          } 
        />
        
        {/* 未定義路由導回 Dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;