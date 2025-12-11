// src/context/ThemeContext.tsx
import React, { createContext, useContext, useState, useMemo } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import axios from 'axios';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleColorMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

// 自訂 Hook，讓其他組件方便使用
export const useColorMode = () => useContext(ThemeContext);

export const ThemeContextProvider = ({ children }: { children: React.ReactNode }) => {
  // 1. 優先從 LocalStorage 讀取，沒有的話預設 light
  const storedTheme = localStorage.getItem('plms_theme') as ThemeMode | null;
  const [mode, setMode] = useState<ThemeMode>(storedTheme || 'light');

  

  // 2. 切換模式的函式 (核心邏輯)
  const toggleColorMode = async () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('plms_theme', newMode); // 同步 LocalStorage

    // ★ 關鍵：打 API 通知後端儲存設定
    try {
      const token = localStorage.getItem('plms_token');
      if (token) {
        // 請確保後端有對應的 API (PUT /api/user/theme)
        // 這裡僅發送請求，不等待回應，因為 UI 回饋優先
        await axios.put('http://192.168.10.1/api/user/theme', 
          { theme: newMode },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (e) {
      console.error("無法儲存樣式設定至伺服器", e);
    }
  };

  // 3. 建立 MUI Theme 物件
  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            // [淺色模式設定]
            background: {
              default: '#f5f7fa', // 整個網頁的背景 (淺灰)
              paper: '#ffffff',   // 卡片/側邊欄的背景 (純白)
            },
            text: {
              primary: '#1a202c', // 主要文字 (深黑)
              secondary: '#64748b', // 次要文字 (灰)
            },
          }
        : {
            // [深色模式設定]
            background: {
              default: '#121212', // 整個網頁的背景 (極深灰)
              paper: '#1e1e1e',   // 卡片/側邊欄的背景 (稍亮一點的灰)
            },
            text: {
              primary: '#ffffff', // 主要文字 (白)
              secondary: '#a0aec0', // 次要文字 (淺灰)
            },
            divider: 'rgba(255, 255, 255, 0.12)', // 分隔線顏色
          }),
    },
    // 這裡可以全域設定組件樣式
    components: {
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'light' ? '#fff' : '#1e1e1e',
            borderRight: '1px solid',
            borderColor: mode === 'light' ? '#e0e0e0' : 'rgba(255, 255, 255, 0.12)',
          },
        },
      },
    },
  }), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleColorMode }}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};