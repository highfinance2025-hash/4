// assets/js/app.js - VERSION FINAL
import { Cart } from './cart.js';
import { Wishlist } from './wishlist.js';
import { ProductManager } from './helpers.js';
import { SEOManager } from './seo-manager.js';
import { PerformanceManager } from './performance.js';

class HealthyTasteApp {
    constructor() {
        this.modules = {};
        this.settings = {};
        this.products = [];
        this.init();
    }
    
    async init() {
        try {
            console.log('🚀 راه‌اندازی فروشگاه...');
            
            // 1. راه‌اندازی ماژول‌ها
            this.modules.cart = new Cart();
            this.modules.wishlist = new Wishlist();
            this.modules.products = new ProductManager();
            this.modules.seo = new SEOManager();
            this.modules.performance = new PerformanceManager();
            
            // 2. بارگیری داده‌ها از data.json
            await this.loadData();
            
            // 3. تنظیم event listeners
            this.setupEvents();
            
            // 4. راه‌اندازی UI
            this.initUI();
            
            // 5. ثبت Service Worker
            this.registerSW();
            
            console.log('✅ فروشگاه با موفقیت راه‌اندازی شد');
            
        } catch (error) {
            console.error('❌ خطا در راه‌اندازی:', error);
            this.showError();
        }
    }
    
    async loadData() {
        try {
            const response = await fetch('data.json');
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const allData = await response.json();
            
            // ذخیره داده‌ها
            this.settings = allData.settings || {};
            this.products = allData.products || [];
            
            console.log(`✅ ${this.products.length} محصول بارگذاری شد`);
            
            // اعمال تنظیمات
            this.applySettings();
            
            // نمایش محصولات
            this.modules.products.renderProducts(this.products);
            
        } catch (error) {
            console.error('❌ خطا در بارگیری data.json:', error);
            this.useFallback();
        }
    }
    
    applySettings() {
        if (!this.settings) return;
        
        // به‌روزرسانی عنوان سایت
        if (this.settings.siteTitle) {
            document.title = this.settings.siteTitle;
        }
        
        // به‌روزرسانی اطلاعات تماس
        if (this.settings.contact?.phone) {
            this.updateContactInfo();
        }
        
        // به‌روزرسانی شبکه‌های اجتماعی
        if (this.settings.social) {
            this.updateSocialLinks();
        }
    }
    
    updateContactInfo() {
        const phone = this.settings.contact.phone;
        const email = this.settings.contact.email;
        
        // به‌روزرسانی شماره تلفن
        document.querySelectorAll('.contact-phone').forEach(el => {
            el.textContent = phone;
            el.href = `tel:${phone.replace(/\D/g, '')}`;
        });
        
        // به‌روزرسانی ایمیل
        document.querySelectorAll('.contact-email').forEach(el => {
            el.textContent = email;
            el.href = `mailto:${email}`;
        });
    }
    
    updateSocialLinks() {
        const social = this.settings.social;
        
        // Instagram
        if (social.instagram) {
            document.querySelectorAll('[data-social="instagram"]').forEach(el => {
                el.href = social.instagram;
            });
        }
        
        // WhatsApp
        if (social.whatsapp) {
            const waBtn = document.querySelector('.whatsapp-float');
            if (waBtn) waBtn.href = social.whatsapp;
        }
    }
    
    setupEvents() {
        // جستجو با debounce
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let timer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    this.handleSearch(e.target.value);
                }, 200);
            });
        }
        
        // فیلتر محصولات
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.handleFilter(filter);
            });
        });
        
        // Event Delegation برای کلیک‌ها
        document.addEventListener('click', (e) => this.handleClick(e));
        
        // مودال
        document.getElementById('closeModal')?.addEventListener('click', () => {
            this.closeModal();
        });
        
        // Back to top
        const backToTop = document.getElementById('backToTop');
        if (backToTop) {
            window.addEventListener('scroll', () => {
                backToTop.classList.toggle('visible', window.scrollY > 300);
            });
            
            backToTop.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
        
        // منوی موبایل
        document.getElementById('openMenu')?.addEventListener('click', () => {
            this.openMobileMenu();
        });
        
        document.getElementById('menuOverlay')?.addEventListener('click', () => {
            this.closeMobileMenu();
        });
    }
    
    handleClick(event) {
        const target = event.target;
        
        // افزودن به سبد خرید
        if (target.closest('.add-to-cart')) {
            this.addToCart(event);
            return;
        }
        
        // علاقه‌مندی
        if (target.closest('.wishlist-btn')) {
            this.toggleWishlist(event);
            return;
        }
        
        // کلیک روی کارت محصول (باز کردن مودال)
        if (target.closest('.product-card') && 
            !target.closest('.add-to-cart') && 
            !target.closest('.wishlist-btn')) {
            this.openProductModalFromCard(event);
        }
    }
    
    addToCart(event) {
        const btn = event.target.closest('.add-to-cart');
        const card = btn.closest('.product-card');
        const productId = card.dataset.id;
        
        const product = this.products.find(p => p.id == productId);
        if (!product) return;
        
        this.modules.cart.addItem(product);
        
        // انیمیشن تأیید
        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.style.background = 'var(--accent)';
        
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-plus"></i>';
            btn.style.background = '';
        }, 1000);
    }
    
    toggleWishlist(event) {
        const btn = event.target.closest('.wishlist-btn');
        const card = btn.closest('.product-card');
        const productId = card.dataset.id;
        
        const product = this.products.find(p => p.id == productId);
        if (!product) return;
        
        const added = this.modules.wishlist.toggleItem(product);
        const icon = btn.querySelector('i');
        
        if (added) {
            icon.classList.replace('far', 'fas');
            btn.classList.add('active');
        } else {
            icon.classList.replace('fas', 'far');
            btn.classList.remove('active');
        }
    }
    
    openProductModalFromCard(event) {
        const card = event.target.closest('.product-card');
        const productId = card.dataset.id;
        
        const product = this.products.find(p => p.id == productId);
        if (!product) return;
        
        this.showProductModal(product);
    }
    
    showProductModal(product) {
        const modal = document.getElementById('productModal');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalBody) return;
        
        // رندر محصول در مودال
        modalBody.innerHTML = `
            <div class="modal-product">
                <img src="${product.image}" 
                     alt="${product.name}" 
                     class="modal-img">
                <div class="modal-info">
                    <h2>${product.name}</h2>
                    <p>${product.description}</p>
                    <div class="modal-price">${product.price} تومان</div>
                    <div class="modal-actions">
                        <button class="btn btn-primary modal-add-btn">
                            <i class="fas fa-cart-plus"></i>
                            افزودن به سبد
                        </button>
                        <button class="btn btn-outline modal-wish-btn">
                            <i class="far fa-heart"></i>
                            علاقه‌مندی
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // نمایش مودال
        modal.hidden = false;
        setTimeout(() => modal.classList.add('active'), 10);
        
        // رویدادهای مودال
        modal.querySelector('.modal-add-btn').addEventListener('click', () => {
            this.modules.cart.addItem(product);
            this.closeModal();
        });
    }
    
    handleSearch(query) {
        const searchLower = query.toLowerCase().trim();
        
        if (!searchLower) {
            this.modules.products.renderProducts(this.products);
            return;
        }
        
        const filtered = this.products.filter(product => {
            return product.name.toLowerCase().includes(searchLower) ||
                   product.description.toLowerCase().includes(searchLower) ||
                   product.category.toLowerCase().includes(searchLower);
        });
        
        this.modules.products.renderProducts(filtered);
    }
    
    handleFilter(filter) {
        // آپدیت دکمه فعال
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        const filtered = filter === 'all' 
            ? this.products 
            : this.products.filter(p => p.category === filter);
        
        this.modules.products.renderProducts(filtered);
    }
    
    closeModal() {
        const modal = document.getElementById('productModal');
        if (!modal) return;
        
        modal.classList.remove('active');
        setTimeout(() => {
            modal.hidden = true;
        }, 300);
    }
    
    openMobileMenu() {
        const menu = document.getElementById('mobileMenu');
        const overlay = document.getElementById('menuOverlay');
        
        if (menu && overlay) {
            menu.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    closeMobileMenu() {
        const menu = document.getElementById('mobileMenu');
        const overlay = document.getElementById('menuOverlay');
        
        if (menu && overlay) {
            menu.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    initUI() {
        // آپدیت شمارنده‌ها
        this.modules.cart.updateBadge();
        this.modules.wishlist.updateBadge();
    }
    
    registerSW() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('✅ Service Worker ثبت شد'))
                .catch(err => console.warn('⚠️ Service Worker خطا:', err));
        }
    }
    
    useFallback() {
        console.log('⚠️ استفاده از داده‌های پیش‌فرض');
        
        this.products = [
            {
                id: 1,
                name: "ماهی قزل‌آلای تازه",
                description: "ماهی تازه دریای خزر",
                price: "۱۸۵,۰۰۰",
                image: "assets/images/products/fish-400.jpg",
                category: "fish"
            },
            {
                id: 2,
                name: "خاویار طبیعی",
                description: "خاویار درجه یک",
                price: "۴۵۰,۰۰۰",
                image: "assets/images/products/caviar-400.jpg",
                category: "caviar"
            }
        ];
        
        this.modules.products.renderProducts(this.products);
    }
    
    showError() {
        const main = document.querySelector('main');
        if (main) {
            main.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>خطا در بارگذاری</h2>
                    <button class="btn" onclick="location.reload()">
                        تلاش مجدد
                    </button>
                </div>
            `;
        }
    }
}

// راه‌اندازی برنامه
document.addEventListener('DOMContentLoaded', () => {
    window.app = new HealthyTasteApp();
});