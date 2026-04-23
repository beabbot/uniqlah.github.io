// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 1. Remove 'active' class from all buttons and add to clicked one
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filterValue = button.getAttribute('data-filter');

            // 2. Loop through products and show/hide based on category
            productCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');

                if (filterValue === 'all' || filterValue === cardCategory) {
                    card.style.display = 'block'; // Show item
                } else {
                    card.style.display = 'none';  // Hide item
                }
            });
        });
    });

        // --------------------------------------------------------
    // 2. CART HELPERS — read / write localStorage
    // --------------------------------------------------------
    const CART_KEY = 'uniqlah-cart';
 
    function getCart() {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    }
 
    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }
 
 
    // --------------------------------------------------------
    // 3. SHOP PAGE — "Add to Cart" forms (page2)
    // --------------------------------------------------------
    const productForms = document.querySelectorAll('.product-form');
 
    productForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
 
            // Grab product info from the card
            const card      = form.closest('.product-card');
            const infoDiv   = card.querySelector('.product-info');
            const headings  = infoDiv.querySelectorAll('h3');
            const category  = headings[0].textContent.trim();
            const name      = headings[1].textContent.trim();
            const priceText = infoDiv.querySelector('p').textContent.trim(); // "RM 29.90"
            const price     = parseFloat(priceText.replace('RM', '').trim());
 
            const size      = form.querySelector('.size-select').value;
            const quantity  = parseInt(form.querySelector('.qty-input').value, 10);
 
            if (!size) {
                alert('Please select a size before adding to cart.');
                return;
            }
 
            // Add to (or update) cart
            const cart      = getCart();
            const cartKey   = `${name}-${size}`;               // unique per name+size
            const existing  = cart.find(i => i.key === cartKey);
 
            if (existing) {
                existing.quantity += quantity;
            } else {
                cart.push({ key: cartKey, name, category, size, price, quantity });
            }
 
            saveCart(cart);
 
            // Visual feedback — briefly change button text
            const btn = form.querySelector('button[type="submit"]');
            const original = btn.textContent;
            btn.textContent = '✓ Added!';
            btn.disabled = true;
            setTimeout(() => {
                btn.textContent = original;
                btn.disabled = false;
            }, 1200);
        });
    });
 
 
    // --------------------------------------------------------
    // 4. CART PAGE — Render cart table (page3)
    // --------------------------------------------------------
    const cartWrapper   = document.getElementById('cart-wrapper');
    const emptyMsg      = document.getElementById('empty-cart-msg');
    const cartContent   = document.getElementById('cart-content');
    const tableContainer = document.getElementById('cart-table-container');
    const totalDisplay  = document.getElementById('cart-total-display');
    const clearBtn      = document.getElementById('clear-btn');
 
    function calcTotal(cart) {
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }
 
    function renderCart() {
        if (!cartWrapper) return;          // not on cart page
 
        const cart = getCart();
 
        if (cart.length === 0) {
            emptyMsg.style.display    = 'block';
            cartContent.style.display = 'none';
            // Update h1 heading
            const h1 = document.querySelector('h1');
            if (h1) h1.textContent = 'Your Cart is Empty';
            return;
        }
 
        // Update heading
        const h1 = document.querySelector('h1');
        if (h1) h1.textContent = 'Your Cart';
 
        emptyMsg.style.display    = 'none';
        cartContent.style.display = 'block';
 
        // Build table
        let html = `
        <table style="width:100%; border-collapse:collapse;">
            <thead>
                <tr style="border-bottom:1px solid var(--stone-light); text-align:left;">
                    <th style="padding:0.6rem 0;">Item</th>
                    <th style="padding:0.6rem 0;">Size</th>
                    <th style="padding:0.6rem 0;">Qty</th>
                    <th style="padding:0.6rem 0; text-align:right;">Price</th>
                    <th style="padding:0.6rem 0;"></th>
                </tr>
            </thead>
            <tbody>`;
 
        cart.forEach((item, index) => {
            const subtotal = (item.price * item.quantity).toFixed(2);
            html += `
                <tr style="border-bottom:1px solid var(--stone-light);" data-index="${index}">
                    <td style="padding:0.75rem 0;">${item.name}</td>
                    <td style="padding:0.75rem 0;">${item.size}</td>
                    <td style="padding:0.75rem 0;">
                        <div style="display:flex; align-items:center; gap:0.5rem;">
                            <button class="qty-btn" data-action="decrease" data-index="${index}" style="border:1px solid var(--stone-light); background:none; padding:0 0.4rem; cursor:pointer;">−</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn" data-action="increase" data-index="${index}" style="border:1px solid var(--stone-light); background:none; padding:0 0.4rem; cursor:pointer;">+</button>
                        </div>
                    </td>
                    <td style="padding:0.75rem 0; text-align:right;">RM ${subtotal}</td>
                    <td style="padding:0.75rem 0; text-align:right;">
                        <button class="remove-btn" data-index="${index}" style="background:none; border:none; cursor:pointer; color:var(--accent); font-size:0.85rem; text-transform:uppercase; letter-spacing:0.05em;">Remove</button>
                    </td>
                </tr>`;
        });
 
        html += `</tbody></table>`;
        tableContainer.innerHTML = html;
 
        // Update total
        totalDisplay.textContent = `RM ${calcTotal(cart).toFixed(2)}`;
 
        // Qty +/- buttons
        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cart  = getCart();
                const index = parseInt(btn.getAttribute('data-index'), 10);
                const action = btn.getAttribute('data-action');
 
                if (action === 'increase') {
                    cart[index].quantity += 1;
                } else {
                    cart[index].quantity -= 1;
                    if (cart[index].quantity <= 0) cart.splice(index, 1);
                }
 
                saveCart(cart);
                renderCart();
            });
        });
 
        // Remove buttons
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cart  = getCart();
                const index = parseInt(btn.getAttribute('data-index'), 10);
                cart.splice(index, 1);
                saveCart(cart);
                renderCart();
            });
        });
    }
 
    // Clear cart button
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Clear all items from your cart?')) {
                saveCart([]);
                renderCart();
            }
        });
    }
 
    // Run on cart page load
    renderCart();
 
});

