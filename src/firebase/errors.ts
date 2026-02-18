export class FirestorePermissionError extends Error {
  constructor(
    message: string,
    public readonly code: string = "permission-denied",
  ) {
    super(message);
    this.name = "FirestorePermissionError";
  }
}
