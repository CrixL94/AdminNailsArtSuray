import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './layers.css'
// El tema se importa antes que index.css para que los overrides tengan prioridad
import 'primereact/resources/themes/lara-light-pink/theme.css'
import 'primeicons/primeicons.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
