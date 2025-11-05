import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Custom hook for syncing state with URL search params
 * @param initialState - Initial state object
 * @returns [state, setState] - State and setter function
 */
export function useUrlSearchParams<T extends Record<string, any>>(
  initialState: T
): [T, (updates: Partial<T>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<T>(() => {
    // Initialize state from URL params if available
    const params: any = { ...initialState };
    
    searchParams.forEach((value, key) => {
      if (key in initialState) {
        // Parse numbers
        if (typeof initialState[key] === 'number') {
          params[key] = parseInt(value, 10) || initialState[key];
        } 
        // Keep strings
        else if (typeof initialState[key] === 'string') {
          params[key] = value;
        }
        // Handle other types
        else {
          params[key] = value;
        }
      }
    });
    
    return params;
  });

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    
    Object.entries(state).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });
    
    setSearchParams(params, { replace: true });
  }, [state, setSearchParams]);

  const updateState = useCallback((updates: Partial<T>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  return [state, updateState];
}

