import { QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import { SkulletProvider } from 'skullet/react'
import App from './App.tsx'
import { queryClient } from '@src/lib/query-client'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <SkulletProvider
      mode="light"
      reveal="smart"
      theme={{
        animation: 'shimmer',
        speed: 'fast',
        light: {
          base: '#e5eeff',
          highlight: '#f8f9ff',
        },
      }}
    >
      <App />
    </SkulletProvider>
  </QueryClientProvider>,
)
