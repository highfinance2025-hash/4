// assets/js/wishlist.js
export class Wishlist {
    constructor() {
        this.items = this.loadFromStorage();
        this.init();
    }
    
    init() {
        this.updateBadge();
        this.setupHeartIcons();
    }
    
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('healthy-wishlist');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading wishlist:', error);
            return [];
        }
    }
    
    saveToStorage() {
        try {
            localStorage.setItem('healthy-wishlist', JSON.stringify(this.items));
        } catch (error) {
            console.error('Error saving wishlist:', error);
        }
    }
    
    toggleItem(product) {
        const itemId = product.id || this.generateId(product);
        const index = this.items.findIndex(item => item.id === itemId);
        
        if (index === -1) {
            // Add to wishlist
            this.items.push({
                id: itemId,
                name: product.name,
                price: product.price,
                image: product.image || '/assets/images/placeholder.jpg',
                addedAt: new Date().toISOString()
            });
            
            this.saveToStorage();
            this.updateBadge();
            this.updateHeartIcon(itemId, true);
            this.showNotification(`${product.name} به علاقه‌مندی‌ها اضافه شد`);
            return true;
        } else {
            // Remove from wishlist
            const removed = this.items.splice(index, 1)[0];
            this.saveToStorage();
            this.updateBadge();
            this.updateHeartIcon(itemId, false);
            this.showNotification(`${removed.name} از علاقه‌مندی‌ها حذف شد`);
            return false;
        }
    }
    
    removeItem(itemId) {
        const index = this.items.findIndex(item => item.id === itemId);
        if (index !== -1) {
            const removed = this.items.splice(index, 1)[0];
            this.saveToStorage();
            this.updateBadge();
            this.updateHeartIcon(itemId, false);
            return removed;
        }
        return null;
    }
    
    clear() {
        this.items = [];
        this.saveToStorage();
        this.updateBadge();
        this.resetAllHeartIcons();
        this.showNotification('لیست علاقه‌مندی‌ها خالی شد');
    }
    
    hasItem(productId) {
        return this.items.some(item => item.id == productId);
    }
    
    updateBadge() {
        const count = this.items.length;
        const badges = document.querySelectorAll('.wishlist-count');
        
        badges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
        
        // Update mobile menu badge
        const mobileBadge = document.querySelector('.wishlist-count-mobile');
        if (mobileBadge) {
            mobileBadge.textContent = count;
            mobileBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }
    
    setupHeartIcons() {
        // Initialize heart icons based on wishlist state
        document.querySelectorAll('.product-card').forEach(card => {
            const productId = card.dataset.id;
            if (productId && this.hasItem(productId)) {
                const heartBtn = card.querySelector('.wishlist-btn');
                if (heartBtn) {
                    const icon = heartBtn.querySelector('i');
                    if (icon) {
                        icon.classList.remove('far');
                        icon.classList.add('fas');
                        heartBtn.setAttribute('aria-pressed', 'true');
                        heartBtn.classList.add('active');
                    }
                }
            }
        });
    }
    
    updateHeartIcon(productId, isActive) {
        // Find all heart buttons for this product
        document.querySelectorAll(`.product-card[data-id="${productId}"] .wishlist-btn`).forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                if (isActive) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    btn.setAttribute('aria-pressed', 'true');
                    btn.classList.add('active');
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                    btn.setAttribute('aria-pressed', 'false');
                    btn.classList.remove('active');
                }
            }
        });
    }
    
    resetAllHeartIcons() {
        document.querySelectorAll('.wishlist-btn').forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.remove('fas');
                icon.classList.add('far');
                btn.setAttribute('aria-pressed', 'false');
                btn.classList.remove('active');
            }
        });
    }
    
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `wishlist-notification ${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 150px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 9998;
            animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: 'Vazirmatn', sans-serif;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
    
    generateId(product) {
        // Generate ID from product name
        return product.name.replace(/\s+/g, '-').toLowerCase() + '-' + Date.now();
    }
    
    // Export for debugging
    exportData() {
        return {
            items: this.items,
            count: this.items.length
        };
    }
}