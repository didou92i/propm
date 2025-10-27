import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

// Configuration React Query ultra-légère pour le chargement initial
// Les options par défaut seront appliquées progressivement
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Utilisation de requestIdleCallback pour différer les initialisations non-critiques
const deferNonCriticalSetup = () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Préchargement des ressources non-critiques ici si nécessaire
      console.debug('Non-critical setup completed')
    }, { timeout: 2000 })
  }
}

// Rendu immédiat du shell, setup différé pour réduire TBT
const root = createRoot(document.getElementById("root")!)
root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)

// Exécuter les tâches non-critiques après le rendu initial
deferNonCriticalSetup()
