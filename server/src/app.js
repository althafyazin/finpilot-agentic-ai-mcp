const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config/env');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const exportRoutes = require('./routes/exportRoutes');
const insightRoutes = require('./routes/insightRoutes');
const recurringRoutes = require('./routes/recurringRoutes');
const aiRoutes = require('./routes/aiRoutes');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/AppError');

const app = express();

// 1. Security Middleware
app.use(helmet());

// 2. CORS Middleware configuration
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

// 3. Request Logging Middleware (Development format)
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// 4. Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Application API Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/incomes', incomeRoutes);
app.use('/api/v1/budgets', budgetRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/export', exportRoutes);
app.use('/api/v1/insights', insightRoutes);
app.use('/api/v1/recurring', recurringRoutes);
app.use('/api/v1/ai', aiRoutes);

// Direct root health shortcut
app.use('/health', healthRoutes);

// 6. 404 Route Not Found Middleware
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 7. Global Central Error Handling Middleware
app.use(errorHandler);

module.exports = app;
