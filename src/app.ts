import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import recordRoutes from './routes/record.routes';
import analyticsRoutes from './routes/analytics.routes';
import { notFoundHandler, globalErrorHandler } from './middleware/error.middleware';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/dashboard', analyticsRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
