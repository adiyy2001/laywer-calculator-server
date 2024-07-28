import { Request, Response, NextFunction } from 'express';
import { getAllRates } from '../utils/databaseUtils';

export const getWiborRatesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rates = await getAllRates();
    res.json(rates);
  } catch (error) {
    next(error);
  }
};
