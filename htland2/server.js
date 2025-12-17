const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const logger = require('./utils/logger');

// بارگذاری متغیرهای محیطی
dotenv.config();

// بارگذاری کانفیگ
const config = require('./config/env');

// ایجاد اپلیکیشن Express
const app = express();

// Middlewareهای پایه
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', config.frontendUrl);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Device-ID');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Routes
const walletRoutes = require('./routes/wallet');
app.use('/api/wallet', walletRoutes);

// Route سلامت
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'htland-wallet',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'مسیر یافت نشد'
  });
});

// هندلر خطاهای سرور
app.use((err, req, res, next) => {
  logger.error('Server error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    error: 'خطای سرور داخلی'
  });
});

// اتصال به MongoDB و راه‌اندازی سرور
const startServer = async () => {
  try {
    // اتصال به MongoDB
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    logger.info('✅ Connected to MongoDB successfully');
    
    // راه‌اندازی سرور
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server is running on port ${config.port}`);
      logger.info(`📁 Environment: ${config.env}`);
      logger.info(`🌐 App URL: ${config.appUrl}`);
    });
    
    // هندلر graceful shutdown
    const shutdown = async () => {
      logger.info('🛑 Shutting down server gracefully...');
      
      server.close(async () => {
        await mongoose.connection.close();
        logger.info('✅ MongoDB connection closed');
        process.exit(0);
      });
      
      // اگر بعد از 10 ثانیه بسته نشد، فورس کن
      setTimeout(() => {
        logger.error('❌ Forcing shutdown...');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    logger.error('❌ Failed to start server:', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

// شروع سرور
startServer();

module.exports = app;