import { Request, Response, NextFunction } from 'express';
import { fetchWiborRates } from '../utils/puppeteerUtils';
import { saveRatesToDatabase } from '../utils/databaseUtils';

const defaultDateString = '2010-03-03'; 

export const fetchWiborRatesHandler = async (req: Request, res: Response, next: NextFunction) => {
  let startDate = req.body.startDate ? new Date(req.body.startDate) : new Date (defaultDateString)
  try {
    const rates = await fetchWiborRates(startDate);
    await saveRatesToDatabase(rates); 
    res.json(rates);
  } catch (error) {
    next(error);
  }
};
