import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'  // 👈 ADD THIS LINE
import './index.css'
import App from './App.jsx'

// 👇 ADD THIS: Create the memory box for your data
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,  // 10 minutes globally (optional, can set per query too)
      refetchOnWindowFocus: false, // Prevents refetch when switching browser tabs
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 👇 ADD THIS: Wrap App with QueryClientProvider */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)