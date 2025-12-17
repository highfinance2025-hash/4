/**
 * @file ابزارهای آپلود فایل برای HTLand
 * @description پیکربندی multer برای آپلود تصاویر پروفایل
 * @since 1403/10/01
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ایجاد پوشه uploads اگر وجود ندارد
const uploadDir = 'uploads/profile-images';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// پیکربندی ذخیره‌سازی فایل
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // نام فایل: userid-timestamp.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `user-${req.user._id}-${uniqueSuffix}${ext}`);
  }
});

// فیلتر فایل‌ها
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('فقط تصاویر با فرمت‌های JPEG, JPG, PNG, WebP مجاز هستند'));
  }
};

// پیکربندی multer برای آپلود تصویر پروفایل
const uploadProfileImage = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // حداکثر 5MB
  },
  fileFilter: fileFilter
});

/**
 * حذف فایل از سیستم
 * @param {string} filePath - مسیر فایل
 */
const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

/**
 * بررسی نوع فایل
 * @param {Object} file - فایل
 * @returns {boolean} آیا فایل تصویر است؟
 */
const isImageFile = (file) => {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return imageTypes.includes(file.mimetype);
};

/**
 * بررسی حجم فایل
 * @param {Object} file - فایل
 * @param {number} maxSizeMB - حداکثر حجم به مگابایت
 * @returns {boolean} آیا حجم فایل قابل قبول است؟
 */
const isValidFileSize = (file, maxSizeMB = 5) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * دریافت اطلاعات فایل
 * @param {Object} file - فایل
 * @returns {Object} اطلاعات فایل
 */
const getFileInfo = (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const name = path.basename(file.originalname, ext);
  
  return {
    originalName: file.originalname,
    fileName: file.filename,
    filePath: file.path,
    size: file.size,
    mimeType: file.mimetype,
    extension: ext.replace('.', ''),
    dimensions: null // بعداً با sharp می‌توان ابعاد را گرفت
  };
};

module.exports = {
  uploadProfileImage,
  deleteFile,
  isImageFile,
  isValidFileSize,
  getFileInfo
};