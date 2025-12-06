// assets/js/cart.js
export class Cart {
    constructor() {
        this.items = this.loadFromStorage();
        this.init();
    }
    
    init() {
        this.updateBadge();
        this.setupStorageListener();
    }
    
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('healthy-cart');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading cart:', error);
            return [];
        }
    }
    
    saveToStorage() {
        try {
            localStorage.setItem('healthy-cart', JSON.stringify(this.items));
        } catch (error) {
            console.error('Error saving cart:', error);
            // Fallback: Save only 5 items if quota exceeded
            if (error.name === 'QuotaExceededError') {
                this.items = this.items.slice(0, 5);
                localStorage.setItem('healthy-cart', JSON.stringify(this.items));
            }
        }
    }
    
    addItem(product) {
        // Generate unique ID if not exists
        const itemId = product.id || Date.now();
        
        const existingItem = this.items.find(item => item.id === itemId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                id: itemId,
                name: product.name,
                price: this.parsePrice(product.price),
                image: product.image || '/assets/images/placeholder.jpg',
                quantity: 1,
                addedAt: new Date().toISOString()
            });
        }
        
        this.saveToStorage();
        this.updateBadge();
        this.showNotification(`${product.name} به سبد اضافه شد`);
        
        // Dispatch event for other modules
        document.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: { items: this.items }
        }));
        
        return this.items;
    }
    
    removeItem(itemId) {
        const index = this.items.findIndex(item => item.id === itemId);
        if (index !== -1) {
            const removed = this.items.splice(index, 1)[0];
            this.saveToStorage();
            this.updateBadge();
            this.showNotification(`${removed.name} از سبد حذف شد`);
        }
    }
    
    updateQuantity(itemId, newQuantity) {
        const item = this.items.find(item => item.id === itemId);
        if (item) {
            if (newQuantity < 1) {
                this.removeItem(itemId);
            } else {
                item.quantity = newQuantity;
                this.saveToStorage();
                this.updateBadge();
            }
        }
    }
    
    clear() {
        this.items = [];
        this.saveToStorage();
        this.updateBadge();
        this.showNotification('سبد خرید خالی شد');
    }
    
    getTotal() {
        return this.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }
    
    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }
    
    updateBadge() {
        const count = this.getItemCount();
        const badges = document.querySelectorAll('.cart-count');
        
        badges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
        
        // Update mobile menu badge
        const mobileBadge = document.querySelector('.cart-count-mobile');
        if (mobileBadge) {
            mobileBadge.textContent = count;
            mobileBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }
    
    showNotification(message, type = 'success') {
        // Remove existing notification
        const existing = document.querySelector('.cart-notification');
        if (existing) existing.remove();
        
        // Create new notification
        const notification = document.createElement('div');
        notification.className = `cart-notification ${type}`;
        notification.textContent = message;
        
        // Style
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 9999;
            animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: 'Vazirmatn', sans-serif;
        `;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
    
    parsePrice(priceStr) {
        // تبدیل "۱۸۵,۰۰۰ تومان" به 185000
        if (typeof priceStr === 'number') return priceStr;
        
        const clean = priceStr.replace(/[^۰-۹]/g, '');
        const persianToEnglish = clean.replace(/[۰-۹]/g, d => 
            '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)
        );
        
        return parseInt(persianToEnglish) || 0;
    }
    
    formatPrice(price) {
        // تبدیل 185000 به "۱۸۵,۰۰۰ تومان"
        const formatter = new Intl.NumberFormat('fa-IR', {
            style: 'currency',
            currency: 'IRR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        
        return formatter.format(price).replace('ریال', 'تومان');
    }
    
    setupStorageListener() {
        // Listen for storage changes from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'healthy-cart') {
                this.items = this.loadFromStorage();
                this.updateBadge();
            }
        });
    }
    
    // Export for debugging
    exportData() {
        return {
            items: this.items,
            total: this.getTotal(),
            count: this.getItemCount(),
            formattedTotal: this.formatPrice(this.getTotal())
        };
    }
}