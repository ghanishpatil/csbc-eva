/**
 * Centralized error handling utilities
 * Provides consistent error detection and user-friendly messages
 */

export interface ErrorInfo {
  message: string;
  isNetworkError: boolean;
  isFirebaseError: boolean;
  isBlockedError: boolean;
  shouldRetry: boolean;
  userMessage: string;
}

/**
 * Detect error type and extract user-friendly message
 */
export const handleError = (error: any): ErrorInfo => {
  const errorMessage = error?.message || '';
  const errorCode = error?.code || '';
  const responseError = error?.response?.data?.error || '';
  
  // Combine all error sources
  const fullError = `${errorMessage} ${errorCode} ${responseError}`.toLowerCase();
  
  // Network/Firebase blocking detection
  const isBlockedError = 
    fullError.includes('err_blocked_by_client') ||
    fullError.includes('blocked') ||
    fullError.includes('cors') ||
    error?.response?.status === 0;
  
  // Network error detection
  const isNetworkError =
    isBlockedError ||
    fullError.includes('network') ||
    fullError.includes('offline') ||
    fullError.includes('timeout') ||
    fullError.includes('failed to fetch') ||
    fullError.includes('networkerror') ||
    error?.response?.status >= 500 ||
    error?.code === 'ECONNABORTED' ||
    error?.code === 'ETIMEDOUT';
  
  // Firebase error detection
  const isFirebaseError =
    fullError.includes('firebase') ||
    fullError.includes('firestore') ||
    fullError.includes('permission-denied') ||
    fullError.includes('unavailable') ||
    errorCode?.startsWith('auth/') ||
    errorCode?.startsWith('permission-denied');
  
  // Determine if retry is appropriate
  const shouldRetry = isNetworkError && !isBlockedError;
  
  // Generate user-friendly message
  let userMessage = '';
  
  if (isBlockedError) {
    userMessage = 
      'Network requests are being blocked.\n' +
      'Please disable ad blockers or browser extensions\n' +
      'that block firestore.googleapis.com or API requests.';
  } else if (isNetworkError) {
    userMessage = 
      'Network connection error.\n' +
      'Please check your internet connection and try again.';
  } else if (isFirebaseError) {
    if (fullError.includes('permission-denied')) {
      userMessage = 'Access denied. You do not have permission to perform this action.';
    } else if (fullError.includes('unavailable')) {
      userMessage = 'Firebase service is temporarily unavailable. Please try again.';
    } else {
      userMessage = 'Database error. Please try again or contact support.';
    }
  } else if (error?.response?.status === 401) {
    userMessage = 'Authentication failed. Please log in again.';
  } else if (error?.response?.status === 403) {
    userMessage = 'Access forbidden. You do not have permission.';
  } else if (error?.response?.status === 404) {
    userMessage = 'Resource not found.';
  } else if (error?.response?.status === 429) {
    userMessage = 'Too many requests. Please wait a moment and try again.';
  } else if (error?.response?.status >= 500) {
    userMessage = 'Server error. Please try again later.';
  } else if (responseError) {
    userMessage = responseError;
  } else if (errorMessage) {
    userMessage = errorMessage;
  } else {
    userMessage = 'An unexpected error occurred. Please try again.';
  }
  
  return {
    message: errorMessage || responseError || 'Unknown error',
    isNetworkError,
    isFirebaseError,
    isBlockedError,
    shouldRetry,
    userMessage,
  };
};

/**
 * Show error toast with appropriate duration
 */
export const showErrorToast = (errorInfo: ErrorInfo, customMessage?: string) => {
  const message = customMessage || errorInfo.userMessage;
  const duration = errorInfo.isBlockedError ? 10000 : errorInfo.isNetworkError ? 8000 : 5000;
  
  // Import toast dynamically to avoid circular dependencies
  import('react-hot-toast').then(({ default: toast }) => {
    toast.error(message, { duration });
  }).catch(() => {
    // Fallback if toast import fails
    console.error('Error:', message);
  });
};

/**
 * Handle API/Firebase errors with automatic retry logic
 */
export const handleApiError = async <T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onError?: (error: ErrorInfo) => void;
    customErrorMessage?: string;
  } = {}
): Promise<T | null> => {
  const { maxRetries = 0, retryDelay = 1000, onError, customErrorMessage } = options;
  
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const errorInfo = handleError(error);
      
      // Don't retry if it's a blocking error or non-retryable error
      if (!errorInfo.shouldRetry || attempt >= maxRetries) {
        if (onError) {
          onError(errorInfo);
        } else {
          showErrorToast(errorInfo, customErrorMessage);
        }
        return null;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }
  
  // Final error handling
  const errorInfo = handleError(lastError);
  if (onError) {
    onError(errorInfo);
  } else {
    showErrorToast(errorInfo, customErrorMessage);
  }
  
  return null;
};

/**
 * Wrap Firestore operations with error handling
 */
export const safeFirestoreOperation = async <T>(
  operation: () => Promise<T>,
  fallback: T | null = null
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error: any) {
    const errorInfo = handleError(error);
    console.error('Firestore operation error:', errorInfo);
    
    if (errorInfo.isBlockedError) {
      showErrorToast(errorInfo);
    } else if (errorInfo.isNetworkError) {
      showErrorToast(errorInfo);
    }
    
    return fallback;
  }
};
