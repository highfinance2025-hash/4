// این خط رو تغییر بده:
this.modules.products = new ProductManager();

// به این:
this.modules.products = {
    renderProducts: (products) => {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;
        
        grid.innerHTML = products.map(product => `
            <div class="product-card" data-id="${product.id}" data-category="${product.category}">
                <div class="product-image-container">
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                    ${product.discount ? `<span class="discount-badge">${product.discount}%</span>` : ''}
                </div>
                <div class="product-content">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.shortDescription || product.description.substring(0, 100)}...</p>
                    <div class="product-price-section">
                        <span class="product-price">${product.price} تومان</span>
                        ${product.originalPrice ? `<span class="product-original-price">${product.originalPrice} تومان</span>` : ''}
                    </div>
                    <div class="product-actions">
                        <button class="btn add-to-cart">
                            <i class="fas fa-cart-plus"></i>
                            افزودن به سبد
                        </button>
                        <button class="wishlist-btn">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
};