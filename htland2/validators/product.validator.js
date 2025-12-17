/**
 * اعتبارسنجی پیشرفته محصولات
 */
const Joi = require('joi');

const productSchema = Joi.object({
  name: Joi.string().min(3).max(200).required().messages({
    'string.empty': 'نام محصول الزامی است',
    'string.min': 'نام محصول باید حداقل ۳ کاراکتر باشد',
    'string.max': 'نام محصول نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد'
  }),
  
  description: Joi.string().min(10).max(2000).required().messages({
    'string.empty': 'توضیحات محصول الزامی است',
    'string.min': 'توضیحات باید حداقل ۱۰ کاراکتر باشد',
    'string.max': 'توضیحات نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد'
  }),
  
  price: Joi.number().min(1000).required().messages({
    'number.base': 'قیمت باید عدد باشد',
    'number.min': 'قیمت نمی‌تواند کمتر از ۱۰۰۰ تومان باشد',
    'any.required': 'قیمت الزامی است'
  }),
  
  discountPrice: Joi.number().min(0).less(Joi.ref('price')).messages({
    'number.less': 'قیمت تخفیف باید کمتر از قیمت اصلی باشد',
    'number.min': 'قیمت تخفیف نمی‌تواند منفی باشد'
  }),
  
  category: Joi.string().valid(
    'rice', 'caviar', 'fish', 'honey', 'chicken', 'souvenir'
  ).required(),
  
  categoryFa: Joi.string().valid(
    'برنج شمال', 'خاویار ایرانی', 'ماهی تازه', 'عسل طبیعی', 'مرغ محلی', 'سوغات شمال'
  ).required(),
  
  stock: Joi.number().integer().min(0).default(0),
  
  featured: Joi.boolean().default(false),
  
  tags: Joi.array().items(Joi.string()).default([]),
  
  specifications: Joi.object({
    weight: Joi.object({
      value: Joi.number().min(0),
      unit: Joi.string().valid('گرم', 'کیلوگرم', 'لیتر', 'عدد', 'بسته')
    }),
    origin: Joi.string().default('شمال ایران'),
    shelfLife: Joi.string(),
    storageCondition: Joi.string(),
    certifications: Joi.array().items(Joi.string())
  }).default({})
});

module.exports = {
  validateProduct: (data) => productSchema.validate(data, { abortEarly: false })
};