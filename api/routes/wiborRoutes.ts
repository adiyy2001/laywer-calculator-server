import { Router } from 'express';
import { fetchWiborRatesHandler } from '../services/wiborService';
import { getWiborRatesHandler } from '../services/getWiborRatesHandler'; 
import { asyncHandler } from '../utils/asyncHandler';

export const wiborRouter = Router();

wiborRouter.get('/fetch-wibor-rates', asyncHandler(fetchWiborRatesHandler));
wiborRouter.get('/get-wibor-rates', asyncHandler(getWiborRatesHandler)); 
