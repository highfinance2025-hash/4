/**
 * @file config/env.js
 * @description اعتبارسنجی و مدیریت متغیرهای محیطی
 * این فایل مسئول اعتبارسنجی، پیش‌فرض‌گذاری و مدیریت متغیرهای محیطی است.
 * ویژگی‌های امنیتی:
 * - اعتبارسنجی صریح تمام متغیرهای محیطی
 * - ایجاد پیش‌فرض‌های امن
 * - مخفی‌سازی داده‌های حساس در لاگ
 * - جداسازی محیط‌های توسعه و تولید
 */

const Joi = require('joi');
const logger = require('../utils/logger');

// شماتای اعتبارسنجی متغیرهای محیطی
const envVarsSchema = Joi.object({
  // محیط اجرایی
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development')
    .description('محیط اجرایی برنامه'),

  // پورت سرور
  PORT: Joi.number()
    .port()
    .default(3000)
    .description('پورت اجرای سرور'),

  // URL برنامه
  APP_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required()
    .description('URL کامل برنامه'),

  // URL فرانت‌اند
  FRONTEND_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required()
    .description('URL فرانت‌اند'),

  // MongoDB
  MONGODB_URI: Joi.string()
    .uri({ scheme: ['mongodb', 'mongodb+srv'] })
    .required()
    .description('آدرس اتصال به MongoDB'),

  // JWT Settings
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('کلید مخفی JWT (حداقل 32 کاراکتر)'),
  
  JWT_EXPIRES_IN: Joi.string()
    .pattern(/^(\d+)(?:h|m|d|s)$/)
    .default('7d')
    .description('مدت اعتبار توکن JWT'),

  // تنظیمات زرین‌پال
  ZARINPAL_MERCHANT_ID: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required()
    .description('شناسه مرچنت زرین‌پال'),
  
  ZARINPAL_SANDBOX: Joi.boolean()
    .default(true)
    .description('فعال‌سازی حالت تست زرین‌پال'),
  
  ZARINPAL_CALLBACK_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required()
    .description('URL بازگشت از درگاه پرداخت'),
  
  ZARINPAL_WEBHOOK_SECRET: Joi.string()
    .min(32)
    .required()
    .description('کلید مخفی وب‌هوک زرین‌پال'),

  // تنظیمات امنیتی
  ENCRYPTION_KEY: Joi.string()
    .length(32)
    .required()
    .description('کلید رمزنگاری (32 کاراکتر)'),
  
  SALT_ROUNDS: Joi.number()
    .integer()
    .min(8)
    .default(12)
    .description('تعداد دورهای هشینگ رمز عبور'),

  // محدودیت نرخ
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .integer()
    .min(60000)
    .default(15 * 60 * 1000) // 15 دقیقه
    .description('پنجره زمانی محدودیت نرخ (میلی‌ثانیه)'),
  
  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .integer()
    .min(10)
    .default(100)
    .description('حداکثر تعداد درخواست‌ها در پنجره زمانی'),

  // مدیریت
  ADMIN_EMAILS: Joi.string()
    .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:,[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})*$/)
    .default('')
    .description('ایمیل‌های ادمین‌ها (جداشده با کاما)'),

  // CORS
  ALLOWED_ORIGINS: Joi.string()
    .default('http://localhost:3000,https://htland.ir,https://www.htland.ir')
    .description('منشأهای مجاز برای CORS'),

  // ایمیل
  SMTP_HOST: Joi.string()
    .hostname()
    .default('smtp.gmail.com')
    .description('هاست سرور SMTP'),
  
  SMTP_PORT: Joi.number()
    .port()
    .default(587)
    .description('پورت سرور SMTP'),
  
  SMTP_USER: Joi.string()
    .email()
    .required()
    .description('نام کاربری SMTP'),
  
  SMTP_PASS: Joi.string()
    .min(8)
    .required()
    .description('رمز عبور SMTP'),
  
  EMAIL_FROM: Joi.string()
    .email()
    .default('noreply@htland.ir')
    .description('آدرس ارسال کننده ایمیل'),

  // Redis
  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .default('redis://localhost:6379')
    .description('URL اتصال به Redis'),
  
  REDIS_PASSWORD: Joi.string()
    .allow('')
    .description('رمز عبور Redis'),

  // فایل‌ها
  UPLOAD_PATH: Joi.string()
    .default('uploads')
    .description('مسیر آپلود فایل‌ها'),
  
  MAX_FILE_SIZE: Joi.number()
    .integer()
    .min(1024)
    .default(5 * 1024 * 1024) // 5MB
    .description('حداکثر حجم فایل (بایت)'),
  
  ALLOWED_FILE_TYPES: Joi.string()
    .default('image/jpeg,image/png,image/webp')
    .description('انواع فایل‌های مجاز'),

  // کپچا
  RECAPTCHA_SECRET_KEY: Joi.string()
    .min(20)
    .description('کلید مخفی reCAPTCHA'),
  
  RECAPTCHA_SITE_KEY: Joi.string()
    .min(20)
    .description('کلید سایت reCAPTCHA'),

  // لاگ‌گیری
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info')
    .description('سطح لاگ‌گیری'),
  
  LOG_FILE: Joi.string()
    .default('logs/htland.log')
    .description('مسیر فایل لاگ'),

  // پایگاه‌های مالی ایران
  IRAN_TAX_RATE: Joi.number()
    .precision(2)
    .min(0)
    .max(100)
    .default(9)
    .description('نرخ مالیات ایران (%)'),
  
  MAX_TRANSACTION_AMOUNT: Joi.number()
    .integer()
    .min(10000)
    .default(50000000) // 50 میلیون تومان
    .description('حداکثر مبلغ تراکنش واحد'),

  // امنیت شبکه
  BLOCKED_COUNTRIES: Joi.string()
    .default('')
    .description('کشورهای مسدود شده (جداشده با کاما)'),
})
.unknown() // اجازه متغیرهای اضافی
.messages({
  'any.required': 'فیلد {#label} الزامی است',
  'string.min': 'فیلد {#label} باید حداقل {#limit} کاراکتر باشد',
  'string.length': 'فیلد {#label} باید دقیقاً {#limit} کاراکتر باشد',
  'number.min': 'فیلد {#label} نباید کمتر از {#limit} باشد',
  'number.max': 'فیلد {#label} نباید بیشتر از {#limit} باشد',
});

// اعتبارسنجی متغیرهای محیطی
const { value: envVars, error } = envVarsSchema.validate(process.env, {
  abortEarly: false, // نمایش تمام خطاهای اعتبارسنجی
  convert: true, // تبدیل انواع داده
  allowUnknown: true, // اجازه متغیرهای ناشناخته
});

if (error) {
  // لاگ خطاهای اعتبارسنجی با جزئیات امن
  const errorMessages = error.details.map(detail => ({
    field: detail.context.label,
    message: detail.message.replace(/(password|secret|key)/gi, '***')
  }));

  logger.error('Config validation error:', {
    errors: errorMessages,
    environment: process.env.NODE_ENV
  });

  throw new Error(`خطا در اعتبارسنجی پیکربندی: ${errorMessages.map(e => e.message).join(', ')}`);
}

// ایجاد شیء پیکربندی
const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  appUrl: envVars.APP_URL,
  frontendUrl: envVars.FRONTEND_URL,
  
  // MongoDB
  mongoose: {
    url: envVars.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      keepAlive: true,
      maxIdleTimeMS: 30000
    },
    ssl: envVars.NODE_ENV === 'production'
  },
  
  // JWT
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN
  },
  
  // زرین‌پال
  zarinpal: {
    merchantId: envVars.ZARINPAL_MERCHANT_ID,
    sandbox: envVars.ZARINPAL_SANDBOX,
    callbackUrl: envVars.ZARINPAL_CALLBACK_URL,
    webhookSecret: envVars.ZARINPAL_WEBHOOK_SECRET
  },
  
  // محدودیت نرخ
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    max: envVars.RATE_LIMIT_MAX_REQUESTS,
    message: {
      success: false,
      error: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً بعداً تلاش کنید.'
    }
  },
  
  // رمزنگاری
  encryption: {
    key: envVars.ENCRYPTION_KEY,
    algorithm: 'aes-256-cbc',
    saltRounds: envVars.SALT_ROUNDS
  },
  
  // مدیریت
  admin: {
    emails: envVars.ADMIN_EMAILS ? envVars.ADMIN_EMAILS.split(',') : [],
    defaultPassword: 'change-this-in-production!'
  },
  
  // CORS
  cors: {
    origins: envVars.ALLOWED_ORIGINS.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-ID', 'X-Request-ID']
  },
  
  // ایمیل
  email: {
    host: envVars.SMTP_HOST,
    port: envVars.SMTP_PORT,
    user: envVars.SMTP_USER,
    pass: envVars.SMTP_PASS,
    from: envVars.EMAIL_FROM,
    secure: envVars.SMTP_PORT === 465
  },
  
  // Redis
  redis: {
    url: envVars.REDIS_URL,
    password: envVars.REDIS_PASSWORD || null
  },
  
  // فایل‌ها
  file: {
    uploadPath: envVars.UPLOAD_PATH,
    maxSize: envVars.MAX_FILE_SIZE,
    allowedTypes: envVars.ALLOWED_FILE_TYPES.split(',')
  },
  
  // کپچا
  recaptcha: {
    secretKey: envVars.RECAPTCHA_SECRET_KEY || null,
    siteKey: envVars.RECAPTCHA_SITE_KEY || null,
    enabled: !!envVars.RECAPTCHA_SECRET_KEY
  },
  
  // لاگ‌گیری
  logger: {
    level: envVars.LOG_LEVEL,
    file: envVars.LOG_FILE,
    console: envVars.NODE_ENV !== 'production'
  },
  
  // مالی ایران
  financial: {
    taxRate: envVars.IRAN_TAX_RATE / 100, // تبدیل به درصد
    maxTransactionAmount: envVars.MAX_TRANSACTION_AMOUNT,
    currency: 'IRR',
    currencySymbol: 'تومان'
  },
  
  // امنیت شبکه
  security: {
    blockedCountries: envVars.BLOCKED_COUNTRIES ? envVars.BLOCKED_COUNTRIES.split(',') : [],
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 دقیقه
    passwordMinLength: 8,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 ساعت
    ipWhitelist: process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : []
  }
};

// مخفی‌سازی داده‌های حساس در لاگ
const maskedConfig = {
  ...config,
  jwt: {
    ...config.jwt,
    secret: '***'
  },
  zarinpal: {
    ...config.zarinpal,
    merchantId: '***',
    webhookSecret: '***'
  },
  email: {
    ...config.email,
    pass: '***'
  },
  redis: {
    ...config.redis,
    password: config.redis.password ? '***' : null
  },
  encryption: {
    ...config.encryption,
    key: '***'
  }
};

logger.info('✅ Application configuration loaded successfully', {
  environment: config.env,
  port: config.port,
  database: config.mongoose.url.replace(/\/\/.*@/, '//***@'),
  securityLevel: config.env === 'production' ? 'high' : 'development'
});

module.exports = config;