// ============================================================
//  UNIQLAH — scripts.js
//  Handles: filter buttons, cart (add/render/clear),
//           checkout summary, profile form → summary table
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    // --------------------------------------------------------
    // 1. SHOP PAGE — Category filter buttons (page2)
    // --------------------------------------------------------
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards  = document.querySelectorAll('.product-card');

    // Loop through each filter button and attach a click listener
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove 'active' from all buttons, then set it on the clicked one
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filterValue = button.getAttribute('data-filter');

            // Show or hide each product card based on its category
            productCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                if (filterValue === 'all' || filterValue === cardCategory) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });


    // --------------------------------------------------------
    // 2. CART HELPERS — read / write localStorage
    // --------------------------------------------------------
    const CART_KEY = 'uniqlah-cart';

    // Returns the current cart array from localStorage
    function getCart() {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    }

    // Saves the cart array back to localStorage
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

            // Read product info from the card's HTML
            const card      = form.closest('.product-card');
            const infoDiv   = card.querySelector('.product-info');
            const headings  = infoDiv.querySelectorAll('h3');
            const category  = headings[0].textContent.trim();
            const name      = headings[1].textContent.trim();
            const priceText = infoDiv.querySelector('p').textContent.trim(); // e.g. "RM 29.90"
            const price     = parseFloat(priceText.replace('RM', '').trim());

            const sizeSelect = form.querySelector('.size-select');
            const size       = sizeSelect ? sizeSelect.value : 'One Size';
            const quantity   = parseInt(form.querySelector('.qty-input').value, 10);

            // Validate: size must be selected if dropdown exists
            if (sizeSelect && !size) {
                alert('Please select a size before adding to cart.');
                return;
            }

            // Add new item or increase quantity if same name+size already in cart
            const cart     = getCart();
            const cartKey  = name + '-' + size;
            const existing = cart.find(function(i) { return i.key === cartKey; });

            if (existing) {
                existing.quantity += quantity;
            } else {
                cart.push({ key: cartKey, name: name, category: category, size: size, price: price, quantity: quantity });
            }

            saveCart(cart);

            // Brief visual feedback on the button
            const btn      = form.querySelector('button[type="submit"]');
            const original = btn.textContent;
            btn.textContent = '✓ Added!';
            btn.disabled    = true;
            setTimeout(function() {
                btn.textContent = original;
                btn.disabled    = false;
            }, 1200);
        });
    });


    // --------------------------------------------------------
    // 4. CART PAGE — Render cart table (page3)
    // --------------------------------------------------------
    const cartWrapper    = document.getElementById('cart-wrapper');
    const emptyMsg       = document.getElementById('empty-cart-msg');
    const cartContent    = document.getElementById('cart-content');
    const tableContainer = document.getElementById('cart-table-container');
    const totalDisplay   = document.getElementById('cart-total-display');
    const clearBtn       = document.getElementById('clear-btn');

    // Calculate total price of all items in cart
    function calcTotal(cart) {
        var total = 0;
        for (var i = 0; i < cart.length; i++) {
            total += cart[i].price * cart[i].quantity;
        }
        return total;
    }

    // Build and display the cart table, or show empty message
    function renderCart() {
        if (!cartWrapper) return; // Not on cart page — exit early

        var cart = getCart();

        if (cart.length === 0) {
            // Show empty state
            emptyMsg.classList.remove('hidden-section');
            cartContent.classList.add('hidden-section');
            var h1 = document.querySelector('h1');
            if (h1) { h1.textContent = 'Your Cart is Empty'; }
            return;
        }

        // Show cart content, hide empty message
        var h1 = document.querySelector('h1');
        if (h1) { h1.textContent = 'Your Cart'; }
        emptyMsg.classList.add('hidden-section');
        cartContent.classList.remove('hidden-section');

        // Build table HTML using CSS classes (no inline styles)
        var html = '<table class="cart-table">';
        html += '<thead><tr class="cart-thead-row">';
        html += '<th>Item</th><th>Size</th><th>Qty</th><th class="text-right">Price</th><th></th>';
        html += '</tr></thead><tbody>';

        // Loop through each cart item and create a table row
        for (var i = 0; i < cart.length; i++) {
            var item    = cart[i];
            var subtotal = (item.price * item.quantity).toFixed(2);
            html += '<tr class="cart-row" data-index="' + i + '">';
            html += '<td class="cart-cell">' + item.name + '</td>';
            html += '<td class="cart-cell">' + item.size + '</td>';
            html += '<td class="cart-cell">';
            html += '<div class="qty-controls">';
            html += '<button class="qty-btn" data-action="decrease" data-index="' + i + '">−</button>';
            html += '<span>' + item.quantity + '</span>';
            html += '<button class="qty-btn" data-action="increase" data-index="' + i + '">+</button>';
            html += '</div></td>';
            html += '<td class="cart-cell text-right">RM ' + subtotal + '</td>';
            html += '<td class="cart-cell text-right">';
            html += '<button class="remove-btn" data-index="' + i + '">Remove</button>';
            html += '</td></tr>';
        }

        html += '</tbody></table>';
        tableContainer.innerHTML = html;
        totalDisplay.textContent = 'RM ' + calcTotal(cart).toFixed(2);

        // Attach listeners to qty +/- buttons
        var qtyBtns = document.querySelectorAll('.qty-btn');
        qtyBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var c      = getCart();
                var idx    = parseInt(btn.getAttribute('data-index'), 10);
                var action = btn.getAttribute('data-action');

                if (action === 'increase') {
                    c[idx].quantity += 1;
                } else {
                    c[idx].quantity -= 1;
                    if (c[idx].quantity <= 0) { c.splice(idx, 1); }
                }
                saveCart(c);
                renderCart();
            });
        });

        // Attach listeners to remove buttons
        var removeBtns = document.querySelectorAll('.remove-btn');
        removeBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var c   = getCart();
                var idx = parseInt(btn.getAttribute('data-index'), 10);
                c.splice(idx, 1);
                saveCart(c);
                renderCart();
            });
        });
    }

    // Clear cart button — confirm before wiping
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (confirm('Clear all items from your cart?')) {
                saveCart([]);
                renderCart();
            }
        });
    }

    // Run cart render on page load (only does work if on page3)
    renderCart();


    // --------------------------------------------------------
    // 5. CHECKOUT PAGE — Order summary + form submit (page5)
    // --------------------------------------------------------
    var checkoutSummarySection = document.getElementById('checkout-summary-section');
    var checkoutFormSection    = document.getElementById('checkout-form-section');
    var checkoutEmpty          = document.getElementById('checkout-empty');
    var checkoutSummary        = document.getElementById('checkout-summary');
    var checkoutItemsContainer = document.getElementById('checkout-items-container');
    var checkoutTotal          = document.getElementById('checkout-total');
    var checkoutForm           = document.getElementById('checkoutForm');
    var orderConfirmation      = document.getElementById('order-confirmation');

    // Only run if we are on the checkout page
    if (checkoutForm) {
        var cart = getCart();

        if (cart.length === 0) {
            // Hide summary and form, show empty notice
            checkoutSummary.classList.add('hidden-section');
            checkoutEmpty.classList.remove('hidden-section');
            checkoutFormSection.classList.add('hidden-section');
        } else {
            // Build order summary table using CSS classes
            var total = 0;
            var html  = '<table class="cart-table">';
            html += '<thead><tr class="cart-thead-row">';
            html += '<th>Item</th><th>Size</th><th>Qty</th><th class="text-right">Price</th>';
            html += '</tr></thead><tbody>';

            for (var i = 0; i < cart.length; i++) {
                var item     = cart[i];
                var subtotal = item.price * item.quantity;
                total       += subtotal;
                html += '<tr class="cart-row">';
                html += '<td class="cart-cell">' + item.name + '</td>';
                html += '<td class="cart-cell">' + item.size + '</td>';
                html += '<td class="cart-cell">' + item.quantity + '</td>';
                html += '<td class="cart-cell text-right">RM ' + subtotal.toFixed(2) + '</td>';
                html += '</tr>';
            }

            html += '</tbody></table>';
            checkoutItemsContainer.innerHTML = html;
            checkoutTotal.textContent        = 'RM ' + total.toFixed(2);
        }

        // On checkout form submit: collect data and open summary table in new page
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Collect all form field values
            var name    = document.getElementById('fullName').value;
            var email   = document.getElementById('userEmail').value;
            var phone   = document.getElementById('userContact').value;
            var address = document.getElementById('userAddress').value;
            var notes   = document.getElementById('deliveryNotes').value;
            var payment = document.getElementById('paymentMethod').value;
            var cart    = getCart();

            // Build rows for a two-column (Field | Value) table
            var fields = [
                ['Full Name',        name],
                ['Email Address',    email],
                ['Phone Number',     phone],
                ['Delivery Address', address],
                ['Delivery Notes',   notes || '—'],
                ['Payment Method',   payment]
            ];

            // Add one row per cart item
            for (var i = 0; i < cart.length; i++) {
                fields.push([
                    'Item ' + (i + 1),
                    cart[i].name + ' (' + cart[i].size + ') x' + cart[i].quantity
                    + ' — RM ' + (cart[i].price * cart[i].quantity).toFixed(2)
                ]);
            }

            // Build a complete HTML page string with the summary table
            var tableRows = '';
            for (var j = 0; j < fields.length; j++) {
                tableRows += '<tr><th>' + fields[j][0] + '</th><td>' + fields[j][1] + '</td></tr>';
            }

            var pageHTML = '<!DOCTYPE html>'
                + '<html lang="en"><head>'
                + '<meta charset="UTF-8">'
                + '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
                + '<title>Order Confirmation — Uniqlah</title>'
                + '<link rel="stylesheet" href="./css/styles.css">'
                + '</head><body>'
                + '<div class="container py-20">'
                + '<h1 class="section-title">Order Placed! &#127881;</h1>'
                + '<p class="text-muted">Thank you for shopping with Uniqlah. Here is your order summary:</p>'
                + '<br>'
                + '<table class="summary-table">'
                + '<thead><tr><th>Field</th><th>Value</th></tr></thead>'
                + '<tbody>' + tableRows + '</tbody>'
                + '</table>'
                + '<br>'
                + '<a href="index.html" class="btn">Back to Home</a>'
                + '</div>'
                + '</body></html>';

            // Open a new browser tab and write the summary page into it
            var newTab = window.open('', '_blank');
            newTab.document.open();
            newTab.document.write(pageHTML);
            newTab.document.close();

            // Clear the cart after order is placed
            localStorage.removeItem(CART_KEY);
        });
    }


    // --------------------------------------------------------
    // 6. PROFILE PAGE — Form submit → summary table (page4)
    // --------------------------------------------------------
    var registrationForm = document.getElementById('registrationForm');

    if (registrationForm) {
        registrationForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Collect all profile form field values
            var name    = document.getElementById('fullName').value;
            var email   = document.getElementById('userEmail').value;
            var phone   = document.getElementById('userContact').value;
            var address = document.getElementById('userAddress').value;
            var age     = document.getElementById('userAge').value;
            var gender  = document.getElementById('userGender').value;
            var bio     = document.getElementById('userBio').value;

            // Get selected radio value
            var shopCategory = '';
            var radios = document.querySelectorAll('input[name="shopCategory"]');
            for (var i = 0; i < radios.length; i++) {
                if (radios[i].checked) {
                    shopCategory = radios[i].value;
                    break;
                }
            }

            // Get all checked newsletter checkboxes
            var newsletters = [];
            var checkboxes  = document.querySelectorAll('input[name="newsletter"]');
            for (var i = 0; i < checkboxes.length; i++) {
                if (checkboxes[i].checked) {
                    newsletters.push(checkboxes[i].value);
                }
            }
            var newsletterVal = newsletters.length > 0 ? newsletters.join(', ') : 'None selected';

            // Build two-column table rows (Field | Value)
            var fields = [
                ['Full Name',             name],
                ['Email Address',         email],
                ['Phone Number',          phone],
                ['Address',               address],
                ['Age',                   age],
                ['Gender',                gender],
                ['Preferred Category',    shopCategory],
                ['Newsletter Preferences',newsletterVal],
                ['Delivery Notes / Bio',  bio || '—']
            ];

            var tableRows = '';
            for (var j = 0; j < fields.length; j++) {
                tableRows += '<tr><th>' + fields[j][0] + '</th><td>' + fields[j][1] + '</td></tr>';
            }

            // Build a fresh HTML page string and open it in a new tab
            var pageHTML = '<!DOCTYPE html>'
                + '<html lang="en"><head>'
                + '<meta charset="UTF-8">'
                + '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
                + '<title>Profile Saved — Uniqlah</title>'
                + '<link rel="stylesheet" href="./css/styles.css">'
                + '</head><body>'
                + '<div class="container py-20">'
                + '<h1 class="section-title">Profile Saved! &#10003;</h1>'
                + '<p class="text-muted">Your account details have been saved successfully.</p>'
                + '<br>'
                + '<table class="summary-table">'
                + '<thead><tr><th>Field</th><th>Value</th></tr></thead>'
                + '<tbody>' + tableRows + '</tbody>'
                + '</table>'
                + '<br>'
                + '<a href="page4.html" class="btn">&#8592; Back to Profile</a>'
                + '</div>'
                + '</body></html>';

            var newTab = window.open('', '_blank');
            newTab.document.open();
            newTab.document.write(pageHTML);
            newTab.document.close();
        });
    }

});