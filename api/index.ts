import express from 'express';
import { wiborRouter } from './routes/wiborRoutes';
import { errorHandler } from './middleware/errorHandler';
import { config } from 'dotenv';

config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use('/api', wiborRouter);

// Testowy endpoint do sprawdzenia
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint is working!' });
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
