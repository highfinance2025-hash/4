// assets/js/performance.js
export class PerformanceManager {
    constructor() {
        this.metrics = {};
        this.thresholds = {
            fcp: 1800,    // First Contentful Paint (ms)
            lcp: 2500,    // Largest Contentful Paint (ms)
            fid: 100,     // First Input Delay (ms)
            cls: 0.1,     // Cumulative Layout Shift
            tbt: 300      // Total Blocking Time (ms)
        };
        
        this.init();
    }
    
    init() {
        this.setupPerformanceObserver();
        this.setupResourceMonitoring();
        this.setupCLSMonitoring();
        this.setupLongTasksObserver();
        this.setupMemoryMonitoring();
    }
    
    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            // Observe Largest Contentful Paint
            try {
                const po = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    
                    if (lastEntry) {
                        this.metrics.lcp = lastEntry.startTime;
                        this.checkThreshold('lcp', lastEntry.startTime);
                    }
                });
                
                po.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                console.warn('LCP observation not supported:', e);
            }
            
            // Observe First Input Delay
            try {
                const po = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    
                    entries.forEach(entry => {
                        if (entry.entryType === 'first-input') {
                            this.metrics.fid = entry.processingStart - entry.startTime;
                            this.checkThreshold('fid', this.metrics.fid);
                        }
                    });
                });
                
                po.observe({ type: 'first-input', buffered: true });
            } catch (e) {
                console.warn('FID observation not supported:', e);
            }
        }
    }
    
    setupResourceMonitoring() {
        // Monitor resource loading performance
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    this.logResource(entry);
                    
                    // Warn about slow resources
                    if (entry.duration > 1000) {
                        console.warn(`Slow resource: ${entry.name} (${Math.round(entry.duration)}ms)`);
                    }
                });
            });
            
            observer.observe({ entryTypes: ['resource'] });
        }
    }
    
    setupCLSMonitoring() {
        // Monitor Cumulative Layout Shift
        let clsValue = 0;
        let sessionValue = 0;
        let sessionEntries = [];
        
        const observer = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                // Only count layout shifts without recent user input
                if (!entry.hadRecentInput) {
                    sessionValue += entry.value;
                    sessionEntries.push(entry);
                }
            }
            
            // Update CLS value
            clsValue = sessionValue;
            this.metrics.cls = clsValue;
            
            // Log if threshold exceeded
            if (clsValue > this.thresholds.cls) {
                this.logLayoutShift(sessionEntries);
                sessionEntries = [];
            }
        });
        
        try {
            observer.observe({ type: 'layout-shift', buffered: true });
        } catch (e) {
            console.warn('CLS observation not supported:', e);
        }
    }
    
    setupLongTasksObserver() {
        // Monitor long tasks that block the main thread
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    // Tasks longer than 50ms are considered "long"
                    if (entry.duration > 50) {
                        this.logLongTask(entry);
                    }
                }
            });
            
            observer.observe({ entryTypes: ['longtask'] });
        }
    }
    
    setupMemoryMonitoring() {
        // Monitor memory usage (if supported)
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                this.metrics.memory = {
                    usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024),
                    totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024),
                    jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
                };
                
                // Warn about high memory usage
                if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
                    console.warn('High memory usage detected!');
                }
            }, 10000); // Check every 10 seconds
        }
    }
    
    logResource(entry) {
        const resource = {
            name: entry.name,
            duration: Math.round(entry.duration),
            size: entry.transferSize || entry.encodedBodySize,
            type: entry.initiatorType,
            startTime: Math.round(entry.startTime)
        };
        
        // Store in metrics
        if (!this.metrics.resources) this.metrics.resources = [];
        this.metrics.resources.push(resource);
        
        // Keep only last 20 resources
        if (this.metrics.resources.length > 20) {
            this.metrics.resources.shift();
        }
    }
    
    logLayoutShift(entries) {
        console.group('Layout Shifts Detected');
        entries.forEach(entry => {
            console.log(`Shift: ${entry.value.toFixed(3)}`, entry);
        });
        console.groupEnd();
        
        // Report to analytics
        this.reportToAnalytics('layout_shift', {
            value: this.metrics.cls,
            count: entries.length,
            elements: entries.map(e => e.sources?.[0]?.node?.className || 'unknown')
        });
    }
    
    logLongTask(entry) {
        console.warn(`Long task: ${Math.round(entry.duration)}ms`, entry);
        
        // Report to analytics
        this.reportToAnalytics('long_task', {
            duration: entry.duration,
            startTime: entry.startTime,
            attribution: entry.attribution
        });
    }
    
    checkThreshold(metric, value) {
        if (value > this.thresholds[metric]) {
            console.warn(`⚠️ ${metric.toUpperCase()} threshold exceeded: ${Math.round(value)}ms`);
            
            // Report to analytics
            this.reportToAnalytics('threshold_exceeded', {
                metric,
                value,
                threshold: this.thresholds[metric]
            });
        }
    }
    
    reportToAnalytics(event, data) {
        // Send performance data to analytics
        if (navigator.sendBeacon) {
            const analyticsData = {
                event,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                metrics: this.metrics,
                ...data
            };
            
            navigator.sendBeacon('/api/performance', JSON.stringify(analyticsData));
        }
    }
    
    startMonitoring() {
        // Start periodic performance checks
        setInterval(() => {
            this.collectPerformanceMetrics();
        }, 30000); // Every 30 seconds
    }
    
    collectPerformanceMetrics() {
        // Collect Navigation Timing API data
        if (performance.getEntriesByType) {
            const navigation = performance.getEntriesByType('navigation')[0];
            
            if (navigation) {
                this.metrics.navigation = {
                    dns: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
                    connect: Math.round(navigation.connectEnd - navigation.connectStart),
                    ttfb: Math.round(navigation.responseStart - navigation.requestStart),
                    download: Math.round(navigation.responseEnd - navigation.responseStart),
                    total: Math.round(navigation.loadEventEnd - navigation.startTime)
                };
            }
        }
        
        // Log current metrics
        console.log('[Performance Metrics]', this.metrics);
        
        return this.metrics;
    }
    
    optimizeImages() {
        // Lazy load images that aren't already lazy loaded
        document.querySelectorAll('img:not([loading])').forEach(img => {
            if (this.isBelowTheFold(img)) {
                img.loading = 'lazy';
                img.decoding = 'async';
            }
        });
    }
    
    isBelowTheFold(element) {
        const rect = element.getBoundingClientRect();
        return rect.top > window.innerHeight;
    }
    
    // Public API
    getMetrics() {
        return { ...this.metrics };
    }
    
    getScore() {
        // Calculate a simple performance score (0-100)
        let score = 100;
        
        if (this.metrics.lcp) score -= Math.min(50, (this.metrics.lcp - 1000) / 30);
        if (this.metrics.cls) score -= Math.min(30, this.metrics.cls * 300);
        
        return Math.max(0, Math.round(score));
    }
}