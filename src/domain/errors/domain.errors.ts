export class DomainError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' not found`, 404);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 422);
  }
}
