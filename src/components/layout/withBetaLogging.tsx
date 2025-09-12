import React from 'react';
import { BetaWrapper } from './BetaWrapper';

// HOC pour wrapper automatiquement les composants avec BetaWrapper
export function withBetaLogging<P extends object>(
  Component: React.ComponentType<P>, 
  componentName?: string
) {
  const WrappedComponent = (props: P) => {
    const name = componentName || Component.displayName || Component.name || 'Component';
    
    return (
      <BetaWrapper component={name}>
        <Component {...props} />
      </BetaWrapper>
    );
  };

  WrappedComponent.displayName = `withBetaLogging(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}