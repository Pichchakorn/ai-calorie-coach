// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// ถ้ามีไฟล์ css รวม ให้ import ที่นี่
import './styles/globals.css' // หรือ './styles.css' ถ้าคุณใช้ไฟล์นั้น

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
