import { config } from 'dotenv';
config();

export const PORT = process.env.PORT || 3001;
export const WIBOR_URL = process.env.WIBOR_URL || 'https://www.bankier.pl/mieszkaniowe/stopy-procentowe/wibor';
