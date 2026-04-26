interface AppErrorOptions {
    message: string;
    statusCode: number;
    status: string;
    [key: string]: any;
}

class AppError extends Error {
    public statusCode: number;
    public status: string;
    public isOperational: boolean;

    constructor({ message, statusCode, status, ...props }: AppErrorOptions) {
        super(message);
        
        this.statusCode = statusCode;
        this.status = status;
        this.isOperational = true;

        // Assign additional properties if any
        Object.assign(this, props);

        // Fix the prototype chain for custom errors in TypeScript
        Object.setPrototypeOf(this, AppError.prototype);

        // Capture the stack trace (useful for debugging)
        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;