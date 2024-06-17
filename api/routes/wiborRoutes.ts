import { Router } from 'express';
import { fetchWiborRatesHandler } from '../services/wiborService';
import { asyncHandler } from '../utils/asyncHandler';

export const wiborRouter = Router();

wiborRouter.get('/fetch-wibor-rates', asyncHandler(fetchWiborRatesHandler));
