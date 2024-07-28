import { Router } from 'express';
import { fetchWiborRatesHandler } from '../handler/fetchWiborRatesHandler';
import { getWiborRatesHandler } from '../handler/getWiborRatesHandler'; 
import { asyncHandler } from '../utils/asyncHandler';
import { exportRatesHandler } from '../handler/exportRatesHandler';

export const wiborRouter = Router();

wiborRouter.get('/fetch-wibor-rates', asyncHandler(fetchWiborRatesHandler));
wiborRouter.get('/get-wibor-rates', asyncHandler(getWiborRatesHandler)); 
wiborRouter.get('/export-rates-to-json', asyncHandler(exportRatesHandler)); 
