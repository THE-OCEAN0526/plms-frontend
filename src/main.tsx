import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App' 

// 修改點：在 ('root') 後面加上 !
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)