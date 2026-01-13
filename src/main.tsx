import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  // StrictMode deshabilitado temporalmente para evitar llamadas duplicadas en desarrollo
  // <StrictMode>
    <App />
  // </StrictMode>,
)
