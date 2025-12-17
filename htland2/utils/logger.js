const winston = require('winston');
const path = require('path');
const fs = require('fs');

// ایجاد دایرکتوری logs اگر وجود ندارد
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// فرمت لاگ فارسی
const persianFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    log += ` | ${JSON.stringify(metadata, null, 2)}`;
  }
  
  return log;
});

// ایجاد logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    persianFormat
  ),
  defaultMeta: { service: 'htland-wallet' },
  transports: [
    // فایل خطاها
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // همه لاگ‌ها
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 10
    })
  ]
});

// اگر محیط توسعه است، به کنسول هم نمایش بده
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// تابع کمکی برای لاگ فارسی
logger.persian = {
  info: (message, meta = {}) => {
    logger.info(`📝 ${message}`, meta);
  },
  error: (message, meta = {}) => {
    logger.error(`❌ ${message}`, meta);
  },
  warn: (message, meta = {}) => {
    logger.warn(`⚠️ ${message}`, meta);
  },
  success: (message, meta = {}) => {
    logger.info(`✅ ${message}`, meta);
  }
};

module.exports = logger;