// assets/js/seo-manager.js
export class SEOManager {
    constructor() {
        this.baseUrl = window.location.origin;
        this.init();
    }
    
    init() {
        this.injectBaseStructuredData();
        this.setupMetaTags();
        this.setupCanonicalLinks();
        this.trackUserInteractions();
    }
    
    injectBaseStructuredData() {
        // 1. Website Schema
        const websiteSchema = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "healthy-taste",
            "description": "فروشگاه آنلاین محصولات تازه و ارگانیک شمال ایران",
            "url": this.baseUrl,
            "potentialAction": {
                "@type": "SearchAction",
                "target": `${this.baseUrl}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string"
            },
            "inLanguage": "fa-IR"
        };
        
        // 2. Organization Schema
        const organizationSchema = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "healthy-taste",
            "url": this.baseUrl,
            "logo": `${this.baseUrl}/assets/images/logo.png`,
            "description": "توزیع‌کننده محصولات تازه شمال ایران",
            "address": {
                "@type": "PostalAddress",
                "addressRegion": "گیلان",
                "addressCountry": "IR"
            },
            "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+98-912-345-6789",
                "contactType": "پشتیبانی مشتری",
                "availableLanguage": "Persian"
            },
            "sameAs": [
                "https://instagram.com/healthytaste",
                "https://twitter.com/healthytaste_ir"
            ]
        };
        
        // 3. Breadcrumb Schema
        const breadcrumbSchema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "خانه",
                    "item": this.baseUrl
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "محصولات",
                    "item": `${this.baseUrl}/#products`
                }
            ]
        };
        
        // Inject all schemas
        this.injectSchema(websiteSchema);
        this.injectSchema(organizationSchema);
        this.injectSchema(breadcrumbSchema);
    }
    
    injectProductStructuredData(products) {
        // Create schema for each product
        products.forEach(product => {
            const productSchema = {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": product.name,
                "description": product.description,
                "image": product.image,
                "sku": `PROD-${product.id}`,
                "brand": {
                    "@type": "Brand",
                    "name": "healthy-taste"
                },
                "offers": {
                    "@type": "Offer",
                    "url": `${this.baseUrl}/product/${product.id}`,
                    "priceCurrency": "IRR",
                    "price": this.parsePrice(product.price),
                    "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    "availability": "https://schema.org/InStock",
                    "itemCondition": "https://schema.org/NewCondition"
                },
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.8",
                    "reviewCount": "124"
                }
            };
            
            this.injectSchema(productSchema);
        });
    }
    
    injectSchema(schema) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schema, null, 2);
        document.head.appendChild(script);
    }
    
    setupMetaTags() {
        // Dynamic meta description based on page
        const pageDescription = this.getPageDescription();
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && pageDescription) {
            metaDesc.content = pageDescription;
        }
        
        // Dynamic title
        const pageTitle = this.getPageTitle();
        if (pageTitle && document.title !== pageTitle) {
            document.title = pageTitle;
            
            // Update OG title too
            const ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle) ogTitle.content = pageTitle;
        }
    }
    
    setupCanonicalLinks() {
        // Add canonical link if not exists
        if (!document.querySelector('link[rel="canonical"]')) {
            const link = document.createElement('link');
            link.rel = 'canonical';
            link.href = window.location.href.split('?')[0]; // Remove query params
            document.head.appendChild(link);
        }
    }
    
    getPageDescription() {
        const path = window.location.pathname;
        
        const descriptions = {
            '/': 'خرید آنلاین ماهی تازه دریای خزر، خاویار اصل، برنج هاشمی گیلان و مرغ محلی ارگانیک. ارسال رایگان به سراسر ایران',
            '/products': 'مشاهده تمام محصولات تازه و ارگانیک شمال ایران با کیفیت تضمینی و قیمت مناسب',
            '/about': 'درباره healthy-taste - فروشگاه محصولات سالم و تازه شمال ایران'
        };
        
        return descriptions[path] || descriptions['/'];
    }
    
    getPageTitle() {
        const path = window.location.pathname;
        
        const titles = {
            '/': 'healthy-taste | محصولات تازه و اصیل شمال ایران',
            '/products': 'محصولات | healthy-taste',
            '/about': 'درباره ما | healthy-taste'
        };
        
        return titles[path] || titles['/'];
    }
    
    parsePrice(priceStr) {
        // Convert "۱۸۵,۰۰۰ تومان" to 185000
        const clean = priceStr.replace(/[^۰-۹]/g, '');
        const persianToEnglish = clean.replace(/[۰-۹]/g, d => 
            '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)
        );
        return parseInt(persianToEnglish) || 0;
    }
    
    trackUserInteractions() {
        // Product view tracking
        document.addEventListener('productView', (e) => {
            this.sendEvent('product_view', e.detail);
        });
        
        // Add to cart tracking
        document.addEventListener('addToCart', (e) => {
            this.sendEvent('add_to_cart', e.detail);
        });
        
        // Search tracking
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let lastSearch = '';
            searchInput.addEventListener('blur', () => {
                if (searchInput.value && searchInput.value !== lastSearch) {
                    this.sendEvent('search', { query: searchInput.value });
                    lastSearch = searchInput.value;
                }
            });
        }
    }
    
    sendEvent(eventName, data) {
        // Send to Google Analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, data);
        }
        
        // Send to custom analytics
        if (navigator.sendBeacon) {
            const analyticsData = {
                event: eventName,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                ...data
            };
            
            navigator.sendBeacon('/api/analytics', JSON.stringify(analyticsData));
        }
        
        console.log(`[SEO Event] ${eventName}:`, data);
    }
    
    updateOpenGraphTags(image, title, description) {
        // Dynamically update OG tags for social sharing
        const ogImage = document.querySelector('meta[property="og:image"]');
        const ogTitle = document.querySelector('meta[property="og:title"]');
        const ogDesc = document.querySelector('meta[property="og:description"]');
        
        if (ogImage && image) ogImage.content = image;
        if (ogTitle && title) ogTitle.content = title;
        if (ogDesc && description) ogDesc.content = description;
    }
}