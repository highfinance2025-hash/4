/**
 * @file میدلور احراز هویت HTLand
 * @description مدیریت احراز هویت، مجوزها و امنیت API
 * @since 1.0.0
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const logger = require('../config/logger');
const rateLimit = require('express-rate-limit');

/**
 * @class AuthMiddleware
 * @description میدلورهای مرتبط با احراز هویت و امنیت
 */
class AuthMiddleware {
  
  /**
   * میدلور احراز هویت با JWT
   * @param {Object} req - درخواست Express
   * @param {Object} res - پاسخ Express
   * @param {Function} next - تابع بعدی
   */
  async authenticate(req, res, next) {
    try {
      // دریافت توکن از هدر Authorization
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'دسترسی غیرمجاز. لطفا وارد شوید.'
        });
      }
      
      const token = authHeader.split(' ')[1];
      
      // بررسی اعتبار توکن
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'htland-secret-key-change-in-production'
      );
      
      // پیدا کردن کاربر
      const user = await User.findOne({
        _id: decoded.userId,
        isActive: true
      });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'کاربر یافت نشد یا حساب غیرفعال است'
        });
      }
      
      // بررسی اینکه توکن در لیست سشن‌های فعال باشد
      const activeSession = user.sessions.find(
        session => session.token === token && 
        session.isActive && 
        session.expiresAt > new Date()
      );
      
      if (!activeSession) {
        return res.status(401).json({
          success: false,
          message: 'توکن منقضی شده یا معتبر نیست'
        });
      }
      
      // اضافه کردن اطلاعات کاربر به درخواست
      req.user = {
        userId: user._id,
        phone: user.phone,
        isAdmin: user.isAdmin
      };
      
      // اضافه کردن خود کاربر برای دسترسی سریع
      req.currentUser = user;
      
      next();
      
    } catch (error) {
      logger.error('Authentication error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'توکن معتبر نیست'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'توکن منقضی شده است'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'خطای سرور در احراز هویت'
      });
    }
  }
  
  /**
   * میدلور بررسی مجوزهای کاربر
   * @param {Array} allowedRoles - نقش‌های مجاز
   * @returns {Function} - میدلور Express
   */
  authorize(allowedRoles = []) {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'دسترسی غیرمجاز'
          });
        }
        
        // اگر آرایه خالی باشد، همه کاربران احراز شده مجازند
        if (allowedRoles.length === 0) {
          return next();
        }
        
        // بررسی نقش کاربر
        const userRole = req.user.isAdmin ? 'admin' : 'user';
        
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({
            success: false,
            message: 'شما دسترسی لازم برای این عملیات را ندارید'
          });
        }
        
        next();
        
      } catch (error) {
        logger.error('Authorization error:', error);
        res.status(500).json({
          success: false,
          message: 'خطای سرور در بررسی مجوزها'
        });
      }
    };
  }
  
  /**
   * میدلور اعتبارسنجی شماره موبایل ایرانی
   * @param {Object} req - درخواست Express
   * @param {Object} res - پاسخ Express
   * @param {Function} next - تابع بعدی
   */
  validateIranianPhone(req, res, next) {
    const { phone } = req.body;
    
    if (!phone || !/^09[0-9]{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'شماره موبایل معتبر نیست. لطفا شماره موبایل ایرانی وارد کنید.'
      });
    }
    
    next();
  }
  
  /**
   * میدلور CORS سفارشی
   * @param {Object} req - درخواست Express
   * @param {Object} res - پاسخ Express
   * @param {Function} next - تابع بعدی
   */
  corsMiddleware(req, res, next) {
    // Allow from specific origins in production
    const allowedOrigins = [
      'https://htland.ir',
      'https://www.htland.ir',
      'https://api.htland.ir'
    ];
    
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000');
      allowedOrigins.push('http://localhost:5173');
    }
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  }
  
  /**
   * میدلور محافظت در برابر حملات XSS
   * @param {Object} req - درخواست Express
   * @param {Object} res - پاسخ Express
   * @param {Function} next - تابع بعدی
   */
  xssProtection(req, res, next) {
    // محافظت هدر XSS
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    
    // پاکسازی ورودی‌های کاربر
    const sanitize = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
          // حذف تگ‌های HTML خطرناک
          obj[key] = obj[key]
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<[^>]*>/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '');
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      });
      
      return obj;
    };
    
    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);
    
    next();
  }
  
  /**
   * میدلور Rate Limiting برای API عمومی
   * @param {Object} options - تنظیمات rate limiting
   * @returns {Function} - میدلور Express
   */
  apiRateLimiter(options = {}) {
    const defaultOptions = {
      windowMs: 15 * 60 * 1000, // 15 دقیقه
      max: 100, // ۱۰۰ درخواست در هر پنجره زمانی
      message: {
        success: false,
        message: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفا ۱۵ دقیقه دیگر تلاش کنید.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // استفاده از IP کاربر به عنوان کلید
        return req.ip;
      },
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    };
    
    return rateLimit({ ...defaultOptions, ...options });
  }
  
  /**
   * میدلور Rate Limiting برای ورود
   * @returns {Function} - میدلور Express
   */
  loginRateLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 دقیقه
      max: 5, // ۵ درخواست ورود
      message: {
        success: false,
        message: 'تعداد درخواست‌های ورود شما بیش از حد مجاز است. لطفا ۱۵ دقیقه دیگر تلاش کنید.'
      },
      keyGenerator: (req) => {
        // استفاده از IP + مسیر
        return `${req.ip}_${req.path}`;
      },
      skipSuccessfulRequests: true, // فقط درخواست‌های ناموفق شمارش شوند
      standardHeaders: true
    });
  }
  
  /**
   * میدلور بررسی وجود کاربر
   * @param {Object} req - درخواست Express
   * @param {Object} res - پاسخ Express
   * @param {Function} next - تابع بعدی
   */
  async checkUserExists(req, res, next) {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'کاربر یافت نشد'
        });
      }
      
      // ذخیره کاربر برای استفاده در میدلورهای بعدی
      req.targetUser = user;
      next();
      
    } catch (error) {
      logger.error('Error in checkUserExists:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور در بررسی کاربر'
      });
    }
  }
  
  /**
   * میدلور لاگ‌گیری درخواست‌ها
   * @param {Object} req - درخواست Express
   * @param {Object} res - پاسخ Express
   * @param {Function} next - تابع بعدی
   */
  requestLogger(req, res, next) {
    const startTime = Date.now();
    
    // لاگ درخواست ورودی
    logger.info('Incoming request:', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.user?.userId || 'guest'
    });
    
    // ذخیره تابع اصلی ارسال پاسخ
    const originalSend = res.send;
    
    // رهگیری پاسخ
    res.send = function(data) {
      const duration = Date.now() - startTime;
      
      // لاگ پاسخ خروجی
      logger.info('Outgoing response:', {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: req.user?.userId || 'guest'
      });
      
      // فراخوانی تابع اصلی
      return originalSend.call(this, data);
    };
    
    next();
  }
  
  /**
   * میدلور مدیریت خطاهای غیرمنتظره
   * @param {Error} err - خطا
   * @param {Object} req - درخواست Express
   * @param {Object} res - پاسخ Express
   * @param {Function} next - تابع بعدی
   */
  errorHandler(err, req, res, next) {
    logger.error('Unhandled error:', {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.userId || 'guest',
      ip: req.ip
    });
    
    // در محیط تولید، پیام خطای عمومی نشان داده می‌شود
    const message = process.env.NODE_ENV === 'production' 
      ? 'خطای سرور. لطفا بعدا تلاش کنید.'
      : err.message;
    
    res.status(err.status || 500).json({
      success: false,
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  }
  
  /**
   * میدلور بررسی امنیتی برای هدرها
   * @param {Object} req - درخواست Express
   * @param {Object} res - پاسخ Express
   * @param {Function} next - تابع بعدی
   */
  securityHeaders(req, res, next) {
    // هدرهای امنیتی
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    next();
  }
  
  /**
   * میدلور اعتبارسنجی فرمت داده‌های ورودی
   * @param {Object} req - درخواست Express
   * @param {Object} res - پاسخ Express
   * @param {Function} next - تابع بعدی
   */
  validateInputFormat(req, res, next) {
    const { body } = req;
    
    // بررسی فرمت JSON
    if (req.headers['content-type'] !== 'application/json' && Object.keys(body).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'فرمت داده‌ها باید JSON باشد'
      });
    }
    
    // بررسی اندازه بدنه درخواست
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > 10 * 1024 * 1024) { // 10MB
      return res.status(413).json({
        success: false,
        message: 'حجم داده‌های ارسالی بیش از حد مجاز است'
      });
    }
    
    next();
  }
}

module.exports = new AuthMiddleware();