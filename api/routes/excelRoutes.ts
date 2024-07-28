import express from 'express';
import { generateExcel } from '../handler/excelHandler';

const router = express.Router();

router.post('/generate-excel', generateExcel);

export { router as excelRouter };
