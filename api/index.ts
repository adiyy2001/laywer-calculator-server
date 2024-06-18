import express from 'express';
import cors from 'cors';
import { wiborRouter } from './routes/wiborRoutes';
import { errorHandler } from './middleware/errorHandler';
import { config } from 'dotenv';
import http from 'http';

config();

const app = express();
const port = process.env.PORT || 3001;

// Konfiguracja CORS
app.use(cors());

// Middleware do parsowania JSON
app.use(express.json());

// Router dla WIBOR
app.use('/api', wiborRouter);

// Testowy endpoint do sprawdzenia
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint is working!' });
});

// Middleware do obsługi błędów
app.use(errorHandler);

// Usunięcie nagłówków wymuszających HTTPS
app.use((req, res, next) => {
  res.removeHeader('Strict-Transport-Security');
  next();
});

// Uruchomienie serwera HTTP
const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
