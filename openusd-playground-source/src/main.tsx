import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import OpenUSDApp from './OpenUSDApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OpenUSDApp />
  </StrictMode>,
)
