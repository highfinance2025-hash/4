const crypto = require('crypto');
const logger = require('../utils/logger');
const config = require('./env');

class ZarinpalConfig {
  constructor() {
    this.sandbox = config.zarinpal.sandbox;
    this.merchantId = config.zarinpal.merchantId;
    this.callbackUrl = config.zarinpal.callbackUrl;
    this.webhookSecret = config.zarinpal.webhookSecret;
  }

  // تولید شناسه تراکنش امن
  generateTransactionId() {
    return `HTL${Date.now()}${crypto.randomInt(1000, 9999)}`;
  }

  // اعتبارسنجی کال‌بک
  validateCallback(authority, status, amount) {
    const errors = [];
    
    if (!authority || authority.length !== 36) {
      errors.push('کد authority نامعتبر است');
    }
    
    if (status !== 'OK' && status !== 'NOK') {
      errors.push('وضعیت پرداخت نامعتبر است');
    }
    
    if (typeof amount !== 'number' || amount < 1000 || amount > 50000000) {
      errors.push('مبلغ پرداخت خارج از محدوده مجاز است');
    }
    
    const valid = errors.length === 0;
    
    if (valid) {
      logger.info('Callback validated', {
        authority: this.maskData(authority),
        amount,
        status
      });
    } else {
      logger.warn('Callback validation failed', {
        authority: this.maskData(authority),
        errors
      });
    }
    
    return { valid, errors };
  }

  // ماسک کردن داده‌های حساس
  maskData(data) {
    if (!data || typeof data !== 'string') return '***';
    if (data.length <= 4) return '****';
    return `${'*'.repeat(data.length - 4)}${data.slice(-4)}`;
  }

  // بررسی سلامت سرویس
  async healthCheck() {
    return {
      status: 'healthy',
      service: 'zarinpal',
      sandbox: this.sandbox,
      merchantId: this.maskData(this.merchantId),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new ZarinpalConfig();