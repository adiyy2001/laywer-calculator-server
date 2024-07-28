"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const isProduction = process.env.NODE_ENV === 'production';
const errorHandler = (err, req, res, next) => {
    let customError;
    if (err instanceof Error) {
        customError = err;
    }
    else {
        customError = new Error('An unknown error occurred');
    }
    customError.status = customError.status || 500;
    console.error({
        message: customError.message,
        stack: customError.stack,
        details: customError.details,
    });
    if (!isProduction) {
        res.status(customError.status).json({
            message: customError.message,
            stack: customError.stack,
            details: customError.details,
        });
    }
    else {
        res.status(customError.status).json({
            message: customError.message,
        });
    }
};
exports.errorHandler = errorHandler;
