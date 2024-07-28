import { Request, Response, NextFunction } from 'express';
import { exportRatesToJSON } from '../utils/databaseUtils';
import fs from 'fs';

export const exportRatesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filePath = await exportRatesToJSON();
    res.download(filePath, 'rates.json', (err) => {
      if (err) {
        next(err);
      } else {
        fs.unlinkSync(filePath);
      }
    });
  } catch (error) {
    next(error);
  }
};
