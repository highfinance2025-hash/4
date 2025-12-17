const Joi = require('joi');
const logger = require('../utils/logger');

// شماتای اعتبارسنجی متغیرهای محیطی
const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  
  PORT: Joi.number()
    .port()
    .default(3000),
  
  MONGODB_URI: Joi.string()
    .uri({ scheme: ['mongodb', 'mongodb+srv'] })
    .required(),
  
  JWT_SECRET: Joi.string()
    .min(32)
    .required(),
  
  ENCRYPTION_KEY: Joi.string()
    .length(32)
    .required(),
  
  ZARINPAL_MERCHANT_ID: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required(),
  
  ZARINPAL_CALLBACK_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),
}).unknown();

// اعتبارسنجی
const { value: envVars, error } = envVarsSchema.validate(process.env);

if (error) {
  const errorMessages = error.details.map(detail => ({
    field: detail.context.label,
    message: detail.message.replace(/(password|secret|key)/gi, '***')
  }));

  logger.error('Config validation error:', {
    errors: errorMessages
  });

  throw new Error(`خطا در پیکربندی: ${errorMessages.map(e => e.message).join(', ')}`);
}

// پیکربندی نهایی
const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  appUrl: process.env.APP_URL || `http://localhost:${envVars.PORT}`,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
  
  mongoose: {
    url: envVars.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },
  
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  zarinpal: {
    merchantId: envVars.ZARINPAL_MERCHANT_ID,
    sandbox: process.env.ZARINPAL_SANDBOX === 'true',
    callbackUrl: envVars.ZARINPAL_CALLBACK_URL,
    webhookSecret: process.env.ZARINPAL_WEBHOOK_SECRET || 'default-webhook-secret'
  },
  
  encryption: {
    key: envVars.ENCRYPTION_KEY,
    algorithm: 'aes-256-gcm'
  },
  
  financial: {
    taxRate: (process.env.IRAN_TAX_RATE || 9) / 100,
    maxTransactionAmount: parseInt(process.env.MAX_TRANSACTION_AMOUNT) || 50000000,
    currency: 'IRR',
    currencySymbol: 'تومان'
  }
};

// لاگ پیکربندی (بدون اطلاعات حساس)
logger.info('✅ Configuration loaded successfully', {
  environment: config.env,
  port: config.port,
  database: '***',
  securityLevel: config.env === 'production' ? 'high' : 'development'
});

module.exports = config;