import { useEffect } from 'react';

export const useAgentTheme = (selectedAgent: string) => {
  useEffect(() => {
    // Update the root data attribute for CSS variable transitions
    document.documentElement.setAttribute('data-agent', selectedAgent);
    
    // Optional: Add a class for smooth transitions
    document.documentElement.classList.add('agent-transition');
    
    return () => {
      document.documentElement.classList.remove('agent-transition');
    };
  }, [selectedAgent]);
};