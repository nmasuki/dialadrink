/**
 * Mobile Checkout Optimization
 * Simplifies and optimizes the checkout flow for mobile users
 */

class MobileCheckoutOptimizer {
    
    static optimizeCheckoutFlow(req, res, next) {
        const isMobile = req.headers['user-agent'] && 
                       /Mobile|Android|iPhone|iPad/.test(req.headers['user-agent']);
        
        if (isMobile) {
            // Add mobile-specific checkout helpers
            res.locals.mobileCheckout = {
                // Simplify form steps
                singlePageCheckout: true,
                // Larger input fields
                inputSize: 'large',
                // Auto-focus on relevant fields
                autoFocus: true,
                // Payment shortcuts
                showMpesaFirst: true,
                // Simplified address input
                useLocationPicker: true
            };

            // Mobile checkout form helper
            res.locals.mobileCheckoutForm = function(options = {}) {
                return `
                <div class="mobile-checkout-container">
                    <div class="checkout-progress-mobile">
                        <div class="progress-step active">📋 Details</div>
                        <div class="progress-step">💳 Payment</div>
                        <div class="progress-step">✅ Complete</div>
                    </div>
                    
                    <form class="mobile-checkout-form" id="mobile-checkout">
                        <!-- Contact Information -->
                        <div class="checkout-section">
                            <h3>📞 Contact Information</h3>
                            <input type="tel" 
                                   name="phone" 
                                   placeholder="Phone Number (e.g., 0723688108)" 
                                   class="mobile-input" 
                                   required 
                                   autocomplete="tel"
                                   pattern="[0-9]{10}">
                            
                            <input type="email" 
                                   name="email" 
                                   placeholder="Email Address" 
                                   class="mobile-input" 
                                   autocomplete="email">
                        </div>

                        <!-- Delivery Information -->
                        <div class="checkout-section">
                            <h3>📍 Delivery Location</h3>
                            <select name="area" class="mobile-select" required>
                                <option value="">Select Your Area</option>
                                <option value="westlands">Westlands</option>
                                <option value="karen">Karen</option>
                                <option value="kilimani">Kilimani</option>
                                <option value="kileleshwa">Kileleshwa</option>
                                <option value="lavington">Lavington</option>
                                <option value="runda">Runda</option>
                                <option value="gigiri">Gigiri</option>
                                <option value="muthaiga">Muthaiga</option>
                                <option value="other">Other Area</option>
                            </select>
                            
                            <textarea name="address" 
                                      placeholder="Detailed Address & Directions" 
                                      class="mobile-textarea" 
                                      required
                                      rows="3"></textarea>
                            
                            <div class="delivery-time-picker">
                                <label>⏰ Preferred Delivery Time:</label>
                                <select name="delivery_time" class="mobile-select">
                                    <option value="asap">As Soon As Possible</option>
                                    <option value="1hour">Within 1 Hour</option>
                                    <option value="2hours">Within 2 Hours</option>
                                    <option value="evening">This Evening (6-9 PM)</option>
                                    <option value="tomorrow">Tomorrow</option>
                                </select>
                            </div>
                        </div>

                        <!-- Payment Method -->
                        <div class="checkout-section">
                            <h3>💳 Payment Method</h3>
                            <div class="payment-options-mobile">
                                <label class="payment-option">
                                    <input type="radio" name="payment_method" value="mpesa" checked>
                                    <div class="payment-card mpesa-card">
                                        <div class="payment-icon">📱</div>
                                        <div class="payment-info">
                                            <strong>M-Pesa</strong>
                                            <small>Pay with M-Pesa on delivery</small>
                                        </div>
                                    </div>
                                </label>

                                <label class="payment-option">
                                    <input type="radio" name="payment_method" value="cash">
                                    <div class="payment-card cash-card">
                                        <div class="payment-icon">💵</div>
                                        <div class="payment-info">
                                            <strong>Cash</strong>
                                            <small>Pay cash on delivery</small>
                                        </div>
                                    </div>
                                </label>

                                <label class="payment-option">
                                    <input type="radio" name="payment_method" value="card">
                                    <div class="payment-card card-card">
                                        <div class="payment-icon">💳</div>
                                        <div class="payment-info">
                                            <strong>Card</strong>
                                            <small>Visa/Mastercard</small>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <!-- Order Summary (Collapsible on Mobile) -->
                        <div class="checkout-section">
                            <div class="order-summary-toggle" onclick="toggleOrderSummary()">
                                <h3>📋 Order Summary</h3>
                                <span class="toggle-icon">▼</span>
                            </div>
                            <div class="order-summary-mobile" id="order-summary" style="display: none;">
                                <!-- Cart items will be populated here -->
                                <div class="cart-items-mobile">
                                    <!-- Dynamic content -->
                                </div>
                            </div>
                        </div>

                        <!-- Submit Button -->
                        <div class="checkout-submit-mobile">
                            <button type="submit" class="mobile-submit-btn">
                                🚀 Complete Order
                                <div class="btn-subtitle">Fast & Secure Delivery</div>
                            </button>
                        </div>
                    </form>
                </div>
                
                <script>
                    function toggleOrderSummary() {
                        const summary = document.getElementById('order-summary');
                        const icon = document.querySelector('.toggle-icon');
                        if (summary.style.display === 'none') {
                            summary.style.display = 'block';
                            icon.textContent = '▲';
                        } else {
                            summary.style.display = 'none';
                            icon.textContent = '▼';
                        }
                    }

                    // Auto-format phone number
                    document.querySelector('input[name="phone"]').addEventListener('input', function(e) {
                        let value = e.target.value.replace(/\\D/g, '');
                        if (value.startsWith('254')) {
                            value = '0' + value.substring(3);
                        }
                        if (value.length > 10) {
                            value = value.substring(0, 10);
                        }
                        e.target.value = value;
                    });
                </script>
                `;
            };
        }
        
        next();
    }

    static addTouchOptimizations(req, res, next) {
        // Add touch-friendly utilities
        res.locals.touchButton = function(text, action, type = 'primary') {
            return `
            <button class="touch-btn touch-btn-${type}" 
                    onclick="${action}"
                    style="min-height: 48px; min-width: 48px; padding: 12px 24px;">
                ${text}
            </button>
            `;
        };

        res.locals.touchInput = function(name, placeholder, type = 'text') {
            return `
            <input type="${type}" 
                   name="${name}" 
                   placeholder="${placeholder}"
                   class="touch-input"
                   style="font-size: 16px; padding: 16px; border-radius: 8px; border: 2px solid #ddd;">
            `;
        };

        next();
    }

    static reduceMobilePopups(req, res, next) {
        const isMobile = req.headers['user-agent'] && 
                       /Mobile|Android|iPhone|iPad/.test(req.headers['user-agent']);
        
        if (isMobile) {
            // Disable or simplify popups for mobile
            res.locals.disablePopups = true;
            res.locals.simplifiedNotifications = true;
            
            // Mobile-friendly notification system
            res.locals.mobileNotification = function(message, type = 'info') {
                return `
                <div class="mobile-notification mobile-notification-${type}" 
                     style="position: fixed; top: 20px; left: 20px; right: 20px; 
                            padding: 16px; border-radius: 8px; z-index: 9999;
                            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
                            color: white; font-size: 16px; text-align: center;">
                    ${message}
                    <button onclick="this.parentElement.remove()" 
                            style="float: right; background: none; border: none; color: white; font-size: 18px;">
                        ×
                    </button>
                </div>
                `;
            };
        }
        
        next();
    }
}

module.exports = MobileCheckoutOptimizer;