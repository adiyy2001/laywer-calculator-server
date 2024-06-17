import { Request, Response, NextFunction } from 'express';
import { fetchWiborRates } from '../utils/puppeteerUtils';

export const fetchWiborRatesHandler = async (req: Request, res: Response, next: NextFunction) => {
  const startDateString = req.query.startDate as string;

  if (!startDateString) {
    return res.status(400).send('Start date is required');
  }

  try {
    const rates = await fetchWiborRates(startDateString);
    res.json(rates);
  } catch (error) {
    next(error);
  }
};
