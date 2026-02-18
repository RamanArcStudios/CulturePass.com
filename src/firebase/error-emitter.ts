/**
 * Lightweight pub/sub emitter for Firebase permission errors.
 *
 * Components can subscribe to be notified whenever a Firestore permission
 * error occurs so they can surface appropriate UI (toast, error boundary, etc.).
 */

type ErrorCallback = (error: Error) => void;

const subscribers = new Set<ErrorCallback>();

/**
 * Subscribe to Firebase permission errors.
 *
 * @returns An unsubscribe function that removes the listener.
 */
export function subscribe(callback: ErrorCallback): () => void {
  subscribers.add(callback);

  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Emit a Firebase permission error to all current subscribers.
 */
export function emit(error: Error): void {
  subscribers.forEach((callback) => {
    try {
      callback(error);
    } catch {
      // Prevent a failing subscriber from breaking other listeners.
      console.error(
        "[FirebaseErrorEmitter] A subscriber threw while handling an error:",
        error,
      );
    }
  });
}
