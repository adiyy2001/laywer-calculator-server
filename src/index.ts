import express from 'express';
import { wiborRouter } from './routes/wiborRoutes';
import { errorHandler } from './middleware/errorHandler';
import { config } from 'dotenv';
config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use('/api', wiborRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
