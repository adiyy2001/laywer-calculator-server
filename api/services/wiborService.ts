import { Request, Response, NextFunction } from 'express';
import { fetchWiborRates } from '../utils/puppeteerUtils';
import { saveRatesToDatabase } from '../utils/databaseUtils';

const startDateString = '2024-03-03'; // Stała data początkowa

export const fetchWiborRatesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rates = await fetchWiborRates(startDateString);
    await saveRatesToDatabase(rates); // Zapisanie danych do bazy
    res.json(rates);
  } catch (error) {
    next(error);
  }
};
