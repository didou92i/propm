import { useState, useCallback, useMemo } from 'react';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';

interface UseOptimizedInputOptions {
  maxLength?: number;
  debounceDelay?: number;
  validateOnChange?: boolean;
}

/**
 * Hook optimisé pour la gestion des inputs avec debouncing
 * et validation intelligente
 */
export function useOptimizedInput(
  initialValue: string = '',
  options: UseOptimizedInputOptions = {}
) {
  const { 
    maxLength = 4000, 
    debounceDelay = 300,
    validateOnChange = true 
  } = options;

  const [value, setValue] = useState(initialValue);
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { debounce } = usePerformanceOptimization();

  // Validation optimisée
  const validate = useCallback((inputValue: string): { isValid: boolean; error?: string } => {
    if (inputValue.length > maxLength) {
      return { 
        isValid: false, 
        error: `Le texte ne peut pas dépasser ${maxLength} caractères` 
      };
    }
    
    if (inputValue.trim().length === 0) {
      return { 
        isValid: false, 
        error: 'Le champ ne peut pas être vide' 
      };
    }
    
    return { isValid: true };
  }, [maxLength]);

  // Validation avec debounce
  const debouncedValidate = useMemo(
    () => debounce((inputValue: string) => {
      if (validateOnChange) {
        const validation = validate(inputValue);
        setIsValid(validation.isValid);
        setError(validation.error || null);
      }
    }, debounceDelay),
    [validate, validateOnChange, debounce, debounceDelay]
  );

  // Handler de changement optimisé
  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
    debouncedValidate(newValue);
  }, [debouncedValidate]);

  // Reset optimisé
  const reset = useCallback(() => {
    setValue(initialValue);
    setIsValid(true);
    setError(null);
  }, [initialValue]);

  // Force validation
  const forceValidate = useCallback(() => {
    const validation = validate(value);
    setIsValid(validation.isValid);
    setError(validation.error || null);
    return validation.isValid;
  }, [validate, value]);

  // Statistiques calculées
  const stats = useMemo(() => ({
    length: value.length,
    remainingChars: maxLength - value.length,
    percentUsed: (value.length / maxLength) * 100,
    wordCount: value.trim().split(/\s+/).filter(word => word.length > 0).length,
    isEmpty: value.trim().length === 0
  }), [value, maxLength]);

  return {
    value,
    setValue: handleChange,
    isValid,
    error,
    stats,
    reset,
    forceValidate,
    
    // Helpers
    isEmpty: stats.isEmpty,
    isTooLong: value.length > maxLength,
    canSubmit: isValid && !stats.isEmpty
  };
}