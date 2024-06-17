import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  status?: number;
  details?: any;
}

const isProduction = process.env.NODE_ENV === 'production';

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  let customError: CustomError;

  if (err instanceof Error) {
    customError = err as CustomError;
  } else {
    customError = new Error('An unknown error occurred') as CustomError;
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
  } else {
    res.status(customError.status).json({
      message: customError.message,
    });
  }
};
