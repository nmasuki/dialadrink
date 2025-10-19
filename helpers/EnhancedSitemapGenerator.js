/**
 * Enhanced Sitemap Generator for Better SEO
 * This creates a comprehensive sitemap with proper priorities and change frequencies
 */

const keystone = require('keystone');
const Product = keystone.list('Product');
const ProductCategory = keystone.list('ProductCategory');
const ProductBrand = keystone.list('ProductBrand');
const MenuItem = keystone.list('MenuItem');
const Page = keystone.list('Page');
const Blog = keystone.list('Blog');

class EnhancedSitemapGenerator {
    constructor() {
        this.baseUrl = keystone.get('url') || 'https://dialadrinkkenya.com';
        this.urls = [];
    }

    async generateSitemap() {
        this.urls = [];
        
        // Add static pages with high priority
        await this.addStaticPages();
        
        // Add dynamic content
        await this.addProducts();
        await this.addCategories();
        await this.addBrands();
        await this.addBlogPosts();
        await this.addMenuItems();
        
        // Sort by priority and remove duplicates
        this.urls = this.urls
            .filter((url, index, self) => self.findIndex(u => u.loc === url.loc) === index)
            .sort((a, b) => b.priority - a.priority);

        return this.urls;
    }

    addStaticPages() {
        const staticPages = [
            { 
                loc: '/', 
                priority: 1.0, 
                changefreq: 'daily',
                lastmod: new Date().toISOString()
            },
            { 
                loc: '/products', 
                priority: 0.9, 
                changefreq: 'daily',
                lastmod: new Date().toISOString()
            },
            { 
                loc: '/categories', 
                priority: 0.8, 
                changefreq: 'weekly' 
            },
            { 
                loc: '/brands', 
                priority: 0.8, 
                changefreq: 'weekly' 
            },
            { 
                loc: '/blog', 
                priority: 0.7, 
                changefreq: 'weekly' 
            },
            { 
                loc: '/contact-us', 
                priority: 0.6, 
                changefreq: 'monthly' 
            }
        ];

        staticPages.forEach(page => {
            this.addUrl(page.loc, page.priority, page.changefreq, page.lastmod);
        });
    }

    async addProducts() {
        try {
            const products = await Product.findPublished({})
                .populate('category brand')
                .exec();

            products.forEach(product => {
                const priority = Math.min(0.95, 0.7 + (product.popularity || 0) / 1000);
                const changefreq = product.onOffer ? 'daily' : 'weekly';
                
                this.addUrl(
                    `/product/${product.href}`,
                    priority,
                    changefreq,
                    product.modifiedDate || product.publishedDate
                );
            });
        } catch (error) {
            console.error('Error adding products to sitemap:', error);
        }
    }

    async addCategories() {
        try {
            const categories = await ProductCategory.model.find({}).exec();
            
            categories.forEach(category => {
                this.addUrl(
                    `/category/${category.key}`,
                    0.85,
                    'weekly',
                    category.modifiedDate
                );
            });
        } catch (error) {
            console.error('Error adding categories to sitemap:', error);
        }
    }

    async addBrands() {
        try {
            const brands = await ProductBrand.model.find({}).exec();
            
            brands.forEach(brand => {
                if (brand.href) {
                    this.addUrl(
                        `/brand/${brand.href}`,
                        0.75,
                        'weekly',
                        brand.modifiedDate
                    );
                }
            });
        } catch (error) {
            console.error('Error adding brands to sitemap:', error);
        }
    }

    async addBlogPosts() {
        try {
            const blogs = await Blog.model.find({ state: 'published' }).exec();
            
            blogs.forEach(blog => {
                this.addUrl(
                    `/blog/${blog.href}`,
                    0.7,
                    'monthly',
                    blog.publishedDate
                );
            });
        } catch (error) {
            console.error('Error adding blog posts to sitemap:', error);
        }
    }

    async addMenuItems() {
        try {
            const menuItems = await MenuItem.model.find({}).exec();
            
            menuItems.forEach(item => {
                if (item.href && !this.urls.find(u => u.loc === item.href)) {
                    const priority = item.level === 1 ? 0.8 : 0.6;
                    this.addUrl(
                        item.href,
                        priority,
                        'monthly',
                        item.modifiedDate
                    );
                }
            });
        } catch (error) {
            console.error('Error adding menu items to sitemap:', error);
        }
    }

    addUrl(loc, priority = 0.5, changefreq = 'weekly', lastmod = null) {
        // Ensure URL is properly formatted
        loc = loc.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
        
        this.urls.push({
            loc: `${this.baseUrl}${loc}`,
            priority: Math.round(priority * 100) / 100,
            changefreq,
            lastmod: lastmod ? new Date(lastmod).toISOString().split('T')[0] : null
        });
    }

    generateXML() {
        const urlEntries = this.urls.map(url => {
            return `  <url>
    <loc>${this.escapeXML(url.loc)}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`;
        }).join('\n');

        return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
    }

    escapeXML(str) {
        return str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }
}

// Enhanced sitemap route handler
async function enhancedSitemap(req, res) {
    try {
        const generator = new EnhancedSitemapGenerator();
        await generator.generateSitemap();
        const xml = generator.generateXML();
        
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.send(xml);
    } catch (error) {
        console.error('Sitemap generation error:', error);
        res.status(500).send('Error generating sitemap');
    }
}

module.exports = {
    EnhancedSitemapGenerator,
    enhancedSitemap
};