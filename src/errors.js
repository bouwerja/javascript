export class AppError extends Error {
    constructor(message, statusCode = 500, options = {}) {
        super(message, options);
        this.name = new.target.name;
        this.statusCode = statusCode;
    }
}

export class ValidationError extends AppError {
    constructor(message = 'Invalid request', options) {
        super(message, 400, options);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized', options) {
        super(message, 401, options);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden', options) {
        super(message, 403, options);
    }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource', options) {
    super(`${resource} not found`, 404, options);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', options) {
    super(message, 409, options);
  }
}