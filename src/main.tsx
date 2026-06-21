import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Catch any crash before or during React mount and show it on-page
window.onerror = (msg, _src, _line, _col, err) => {
  const root = document.getElementById('root')
  if (root && !root.hasChildNodes()) {
    root.innerHTML = `<div style="background:#1f2937;color:#f87171;font-family:monospace;padding:24px;min-height:100vh">
      <h2 style="margin:0 0 12px;font-size:16px">App failed to start</h2>
      <pre style="white-space:pre-wrap;font-size:12px">${String(msg)}\n\n${err?.stack ?? ''}</pre>
    </div>`
  }
}

window.addEventListener('unhandledrejection', (e) => {
  const root = document.getElementById('root')
  if (root && !root.hasChildNodes()) {
    root.innerHTML = `<div style="background:#1f2937;color:#f87171;font-family:monospace;padding:24px;min-height:100vh">
      <h2 style="margin:0 0 12px;font-size:16px">App failed to start (promise)</h2>
      <pre style="white-space:pre-wrap;font-size:12px">${String(e.reason)}</pre>
    </div>`
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
