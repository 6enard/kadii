export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class ErrorHandler {
  private static retryAttempts = new Map<string, number>();
  private static maxRetries = 3;

  static handleFirebaseError(error: any, operation: string): AppError {
    console.error(`Firebase error during ${operation}:`, error);

    const baseError = {
      code: error.code || 'unknown',
      message: error.message || 'Unknown error occurred',
      operation
    };

    // Network and connectivity errors
    if (this.isNetworkError(error)) {
      return {
        ...baseError,
        userMessage: 'Connection lost. Please check your internet connection and try again.',
        retryable: true,
        severity: 'medium'
      };
    }

    // Permission errors
    if (error.code === 'permission-denied') {
      return {
        ...baseError,
        userMessage: 'Access denied. Please make sure you\'re logged in and try again.',
        retryable: false,
        severity: 'high'
      };
    }

    // Authentication errors
    if (this.isAuthError(error)) {
      return {
        ...baseError,
        userMessage: 'Authentication failed. Please sign in again.',
        retryable: false,
        severity: 'high'
      };
    }

    // Rate limiting
    if (error.code === 'resource-exhausted' || error.code === 'quota-exceeded') {
      return {
        ...baseError,
        userMessage: 'Too many requests. Please wait a moment and try again.',
        retryable: true,
        severity: 'medium'
      };
    }

    // Data not found
    if (error.code === 'not-found') {
      return {
        ...baseError,
        userMessage: 'The requested data was not found. It may have been removed.',
        retryable: false,
        severity: 'low'
      };
    }

    // Game-specific errors
    if (operation.includes('game') || operation.includes('move')) {
      return {
        ...baseError,
        userMessage: 'Game synchronization failed. Attempting to reconnect...',
        retryable: true,
        severity: 'high'
      };
    }

    // Default error
    return {
      ...baseError,
      userMessage: `Failed to ${operation}. Please try again later.`,
      retryable: true,
      severity: 'medium'
    };
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    const attemptKey = `${operationName}-${Date.now()}`;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        this.retryAttempts.delete(attemptKey);
        return result;
      } catch (error) {
        lastError = error;
        this.retryAttempts.set(attemptKey, attempt);

        const appError = this.handleFirebaseError(error, operationName);
        
        if (!appError.retryable || attempt === maxRetries) {
          this.retryAttempts.delete(attemptKey);
          throw appError;
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await this.delay(delay);
      }
    }

    throw this.handleFirebaseError(lastError, operationName);
  }

  static isNetworkError(error: any): boolean {
    return (
      error.code === 'unavailable' ||
      error.code === 'deadline-exceeded' ||
      error.code === 'cancelled' ||
      error.message?.includes('offline') ||
      error.message?.includes('network') ||
      error.message?.includes('fetch')
    );
  }

  static isAuthError(error: any): boolean {
    return (
      error.code === 'unauthenticated' ||
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/invalid-user-token' ||
      error.code === 'auth/user-token-expired'
    );
  }

  static getRetryAttempt(operationName: string): number {
    const keys = Array.from(this.retryAttempts.keys());
    const matchingKey = keys.find(key => key.startsWith(operationName));
    return matchingKey ? this.retryAttempts.get(matchingKey) || 0 : 0;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const createErrorBoundary = (fallback: React.ComponentType<{ error: Error; retry: () => void }>) => {
  return class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error('Error boundary caught an error:', error, errorInfo);
    }

    retry = () => {
      this.setState({ hasError: false, error: null });
    };

    render() {
      if (this.state.hasError && this.state.error) {
        const FallbackComponent = fallback;
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      return this.props.children;
    }
  };
};