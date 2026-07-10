import { useState, useCallback } from 'react';

/**
 * Custom hook for managing loading states with async operations
 * Provides consistent loading state management across the application
 * 
 * @param {boolean} initialState - Initial loading state (default: false)
 * @returns {Object} Loading state management object
 */
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);

  /**
   * Execute an async function with automatic loading state management
   * @param {Function} asyncFn - Async function to execute
   * @param {Object} callbacks - Optional success/error callbacks
   * @returns {Promise} Result of the async function
   */
  const withLoading = useCallback(async (asyncFn, { onSuccess, onError, onFinally } = {}) => {
    setIsLoading(true);
    
    try {
      const result = await asyncFn();
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      if (onError) {
        onError(error);
      } else {
        throw error; // Re-throw if no error handler provided
      }
    } finally {
      setIsLoading(false);
      
      if (onFinally) {
        onFinally();
      }
    }
  }, []);

  /**
   * Manually start loading state
   */
  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  /**
   * Manually stop loading state
   */
  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    withLoading,
    startLoading,
    stopLoading,
    setIsLoading, // Direct setter for edge cases
  };
};

/**
 * Hook for managing multiple named loading states
 * Useful when a component needs to track different async operations independently
 * 
 * @returns {Object} Multiple loading state management object
 */
export const useMultiLoadingState = () => {
  const [loadingStates, setLoadingStates] = useState({});

  /**
   * Check if a specific operation is loading
   * @param {string} key - Operation key
   * @returns {boolean} Loading state
   */
  const isLoading = useCallback((key) => {
    return loadingStates[key] === true;
  }, [loadingStates]);

  /**
   * Check if any operation is loading
   * @returns {boolean} True if any loading state is active
   */
  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(state => state === true);
  }, [loadingStates]);

  /**
   * Set loading state for a specific operation
   * @param {string} key - Operation key
   * @param {boolean} loading - Loading state
   */
  const setLoading = useCallback((key, loading) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));
  }, []);

  /**
   * Execute an async function with automatic loading state management
   * @param {string} key - Operation key
   * @param {Function} asyncFn - Async function to execute
   * @param {Object} callbacks - Optional success/error callbacks
   * @returns {Promise} Result of the async function
   */
  const withLoading = useCallback(async (key, asyncFn, { onSuccess, onError, onFinally } = {}) => {
    setLoading(key, true);
    
    try {
      const result = await asyncFn();
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      if (onError) {
        onError(error);
      } else {
        throw error;
      }
    } finally {
      setLoading(key, false);
      
      if (onFinally) {
        onFinally();
      }
    }
  }, [setLoading]);

  /**
   * Clear all loading states
   */
  const clearAll = useCallback(() => {
    setLoadingStates({});
  }, []);

  return {
    isLoading,
    isAnyLoading,
    setLoading,
    withLoading,
    clearAll,
    loadingStates, // Expose full state for debugging
  };
};
