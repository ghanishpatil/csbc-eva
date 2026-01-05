/**
 * Request Queue Utility
 * Queues requests when offline and retries when connection is restored
 * SECURITY: Only queues POST requests (flag submissions, status updates)
 * Read operations fail immediately to avoid stale data
 */

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  data: any;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private maxRetries = 3;
  private maxQueueSize = 50;
  private isProcessing = false;
  private listeners: Array<() => void> = [];

  constructor() {
    // Load queue from localStorage
    this.loadQueue();

    // Process queue when online
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.processQueue());
    }
  }

  /**
   * Add a request to the queue if offline
   * SECURITY: Only queue POST/PUT requests (write operations)
   */
  async add<T>(
    url: string,
    method: string,
    data: any,
    headers?: Record<string, string>
  ): Promise<{ queued: boolean; id?: string; data?: T }> {
    // Don't queue read operations
    if (method.toUpperCase() !== 'POST' && method.toUpperCase() !== 'PUT') {
      if (!navigator.onLine) {
        throw new Error('Network error: You are offline');
      }
      // Let it fail normally if offline
      return { queued: false };
    }

    // If online, don't queue
    if (navigator.onLine) {
      return { queued: false };
    }

    // Check queue size limit
    if (this.queue.length >= this.maxQueueSize) {
      console.warn('[RequestQueue] Queue is full, dropping oldest request');
      this.queue.shift();
    }

    // Add to queue
    const queuedRequest: QueuedRequest = {
      id: crypto.randomUUID(),
      url,
      method: method.toUpperCase(),
      data,
      headers,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(queuedRequest);
    this.saveQueue();
    this.notifyListeners();

    console.log(`[RequestQueue] Request queued: ${queuedRequest.id} (${this.queue.length} in queue)`);

    return {
      queued: true,
      id: queuedRequest.id,
    };
  }

  /**
   * Process all queued requests
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !navigator.onLine || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`[RequestQueue] Processing ${this.queue.length} queued requests`);

    const successful: string[] = [];
    const failed: QueuedRequest[] = [];

    for (const request of this.queue) {
      try {
        // Retry the request
        const response = await fetch(request.url, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
            ...request.headers,
          },
          body: JSON.stringify(request.data),
        });

        if (response.ok) {
          successful.push(request.id);
          console.log(`[RequestQueue] Request processed successfully: ${request.id}`);
        } else {
          // Increment retry count
          request.retries++;
          if (request.retries < this.maxRetries) {
            failed.push(request);
            console.warn(`[RequestQueue] Request failed, will retry: ${request.id} (${request.retries}/${this.maxRetries})`);
          } else {
            console.error(`[RequestQueue] Request failed after ${this.maxRetries} retries: ${request.id}`);
            successful.push(request.id); // Remove from queue after max retries
          }
        }
      } catch (error) {
        // Network error - keep in queue
        request.retries++;
        if (request.retries < this.maxRetries) {
          failed.push(request);
          console.warn(`[RequestQueue] Network error, will retry: ${request.id} (${request.retries}/${this.maxRetries})`);
        } else {
          console.error(`[RequestQueue] Request failed after ${this.maxRetries} retries: ${request.id}`);
          successful.push(request.id); // Remove from queue after max retries
        }
      }
    }

    // Remove successful requests
    this.queue = failed;
    this.saveQueue();
    this.notifyListeners();

    this.isProcessing = false;

    if (successful.length > 0) {
      console.log(`[RequestQueue] Processed ${successful.length} requests successfully`);
    }
    if (failed.length > 0) {
      console.log(`[RequestQueue] ${failed.length} requests remain in queue`);
    }
  }

  /**
   * Get queue status
   */
  getStatus(): { queued: number; oldest: number | null } {
    return {
      queued: this.queue.length,
      oldest: this.queue.length > 0 ? this.queue[0].timestamp : null,
    };
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
    this.saveQueue();
    this.notifyListeners();
  }

  /**
   * Save queue to localStorage
   */
  private saveQueue(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('requestQueue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('[RequestQueue] Failed to save queue:', error);
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('requestQueue');
      if (stored) {
        this.queue = JSON.parse(stored);
        // Clean up old requests (older than 24 hours)
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        this.queue = this.queue.filter(req => (now - req.timestamp) < oneDay);
        this.saveQueue();
      }
    } catch (error) {
      console.error('[RequestQueue] Failed to load queue:', error);
      this.queue = [];
    }
  }

  /**
   * Add listener for queue changes
   */
  addListener(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

// Singleton instance
export const requestQueue = new RequestQueue();

/**
 * Enhanced fetch with offline queue support
 * SECURITY: Only queues write operations (POST/PUT)
 */
export const queueableFetch = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const method = options.method || 'GET';

  // If offline and it's a write operation, queue it
  if (!navigator.onLine && (method === 'POST' || method === 'PUT')) {
    const result = await requestQueue.add(
      url,
      method,
      options.body,
      options.headers as Record<string, string>
    );

    if (result.queued) {
      // Return a promise that resolves when processed
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(async () => {
          if (navigator.onLine) {
            try {
              await requestQueue.processQueue();
              clearInterval(checkInterval);
              // Request will be processed, but we can't get the result here
              // User will see success when queue processes
              resolve({ queued: true, id: result.id } as T);
            } catch (error) {
              clearInterval(checkInterval);
              reject(error);
            }
          }
        }, 1000);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Request queue timeout'));
        }, 5 * 60 * 1000);
      });
    }
  }

  // If online or read operation, execute normally
  if (!navigator.onLine && method !== 'POST' && method !== 'PUT') {
    throw new Error('Network error: You are offline');
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
};

