//Uniqlah — Main JavaScript File
//Handles: Shop filtering, Cart management, Checkout, Profile

document.addEventListener('DOMContentLoaded', () => {

//SECTION 1 — SHOP PAGE: Category Filter Buttons (page2)
//Filters product cards based on selected category
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');

    // Attach click listener to each filter button
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (event) => {

            // Remove 'active' class from the previously active button
            const currentActive = document.querySelector('.filter-btn.active');
            if (currentActive) {
                currentActive.classList.remove('active');
            }

            // Mark clicked button as active
            event.target.classList.add('active');

            const selectedCategory = event.target.dataset.filter;

            // Show or hide each product card based on category match
            productCards.forEach(card => {
                const cardCategory = card.dataset.category;

                if (selectedCategory === 'all' || cardCategory === selectedCategory) {
                    // Show card if it matches the selected category (or 'all')
                    card.classList.remove('hidden-section');
                } else {
                    // Hide card if it doesn't match
                    card.classList.add('hidden-section');
                }
            });
        });
    });

//SECTION 2 — STATE MANAGEMENT: Cart via Local Storage
//Stores and retrieves the shopping cart array from localStorage so data persists across pages/sessions
    const CART_KEY = 'uniqlah_user_cart';

//Retrieves the current cart array from localStorage.
//Returns an empty array if nothing is stored yet.
    const getCart = () => {
        const stored = localStorage.getItem(CART_KEY);
        return stored ? JSON.parse(stored) : [];
    };

    /**
     * Saves the updated cart array back into localStorage.
     * @param {Array} cartArray - The full cart array to save
     */
    const saveCart = (cartArray) => {
        localStorage.setItem(CART_KEY, JSON.stringify(cartArray));
    };

//SECTION 3 — SHOP PAGE: Add to Cart Logic (page2)
//Reads product info from the card DOM, validates input, and pushes/updates item in the cart
    const productForms = document.querySelectorAll('.product-form');

    productForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent default page reload on form submit

            // Traverse up to the parent product card to extract product info
            const productCard = form.closest('.product-card');
            const headings = productCard.querySelectorAll('.product-info h3');
            const itemCategory = headings[0].innerText.trim();
            const itemName = headings[1].innerText.trim();

            // Parse price — strip "RM" and convert to number
            const priceText = productCard.querySelector('.product-info p').innerText;
            const itemPrice = Number(priceText.replace('RM', '').trim());

            // Get size and quantity inputs
            const sizeSelect = form.querySelector('.size-select');
            const itemSize = sizeSelect ? sizeSelect.value : 'One Size';
            const itemQty = parseInt(form.querySelector('.qty-input').value, 10);

            // Validation: ensure a size is selected if size dropdown exists
            if (sizeSelect && itemSize === '') {
                alert('Please select a size before adding to cart.');
                return; // Stop execution if validation fails
            }

            // Load current cart and check if this item+size already exists
            const cart = getCart();
            const cartItemId = `${itemName}_${itemSize}`;
            const existingItem = cart.find(item => item.id === cartItemId);

            if (existingItem) {
                // Item already in cart — increase quantity
                existingItem.qty += itemQty;
            } else {
                // New item — add it to the cart array
                cart.push({
                    id: cartItemId,
                    name: itemName,
                    category: itemCategory,
                    size: itemSize,
                    price: itemPrice,
                    qty: itemQty
                });
            }

            saveCart(cart);

            // Visual feedback: temporarily change button text to confirm action
            const addBtn = form.querySelector('button[type="submit"]');
            const originalLabel = addBtn.innerText;
            addBtn.innerText = 'Added ✓';
            addBtn.disabled = true;

            setTimeout(() => {
                addBtn.innerText = originalLabel;
                addBtn.disabled = false;
            }, 1500);
        });
    });

//SECTION 4 — CART PAGE: Dynamic Table Rendering (page3)
//Reads cart from localStorage and builds a live HTML table with +/− quantity controls and a Remove button per row
    const cartWrapper = document.getElementById('cart-wrapper');
    const emptyCartMsg = document.getElementById('empty-cart-msg');
    const cartContent = document.getElementById('cart-content');
    const cartTableContainer = document.getElementById('cart-table-container');
    const cartTotalDisplay = document.getElementById('cart-total-display');
    const clearCartBtn = document.getElementById('clear-btn');

    /**
     * Calculates the total cost of all items in the cart.
     * @param {Array} cart - Array of cart item objects
     * @returns {number} Grand total price
     */
    const calculateTotal = (cart) => {
        return cart.reduce((total, item) => total + (item.price * item.qty), 0);
    };

//Renders the cart table onto the page.
//Shows an empty state message if the cart has no items.
    const renderCartTable = () => {
        // Guard: only run on the cart page
        if (!cartWrapper) return;

        const cart = getCart();
        const pageTitle = document.querySelector('h1');

        // Conditional: show empty state or the cart table
        if (cart.length === 0) {
            // Cart is empty — show message, hide table
            emptyCartMsg.classList.remove('hidden-section');
            cartContent.classList.add('hidden-section');
            if (pageTitle) pageTitle.innerText = 'Your Cart is Empty';
            return;
        }

        // Cart has items — hide empty message, show table
        if (pageTitle) pageTitle.innerText = 'Your Cart';
        emptyCartMsg.classList.add('hidden-section');
        cartContent.classList.remove('hidden-section');

        // Build the table HTML using a loop over cart items
        let tableHTML = `
            <table class="cart-table">
                <thead>
                    <tr class="cart-thead-row">
                        <th>Item</th>
                        <th>Size</th>
                        <th>Qty</th>
                        <th class="text-right">Price</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Loop through each cart item and generate a table row
        cart.forEach((item, index) => {
            const rowTotal = (item.price * item.qty).toFixed(2);
            tableHTML += `
                <tr class="cart-row">
                    <td class="cart-cell">${item.name}</td>
                    <td class="cart-cell">${item.size}</td>
                    <td class="cart-cell">
                        <div class="qty-controls">
                            <button class="qty-btn dec-btn" data-idx="${index}">−</button>
                            <span>${item.qty}</span>
                            <button class="qty-btn inc-btn" data-idx="${index}">+</button>
                        </div>
                    </td>
                    <td class="cart-cell text-right">RM ${rowTotal}</td>
                    <td class="cart-cell text-right">
                        <button class="remove-btn del-btn" data-idx="${index}">Remove</button>
                    </td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table>`;
        cartTableContainer.innerHTML = tableHTML;
        cartTotalDisplay.innerText = `RM ${calculateTotal(cart).toFixed(2)}`;

        // Bind event listeners to the newly rendered buttons
        document.querySelectorAll('.inc-btn').forEach(btn => {
            btn.addEventListener('click', (e) => adjustQuantity(e, 1));
        });
        document.querySelectorAll('.dec-btn').forEach(btn => {
            btn.addEventListener('click', (e) => adjustQuantity(e, -1));
        });
        document.querySelectorAll('.del-btn').forEach(btn => {
            btn.addEventListener('click', removeCartItem);
        });
    };

    /**
     * Increases or decreases the quantity of a cart item.
     * Removes the item automatically if quantity drops to 0 or below.
     * @param {Event} event - Click event from +/− button
     * @param {number} change - Amount to adjust qty by (+1 or -1)
     */
    const adjustQuantity = (event, change) => {
        const cart = getCart();
        const itemIndex = parseInt(event.target.dataset.idx, 10);

        cart[itemIndex].qty += change;

        // Remove item from cart if quantity reaches zero
        if (cart[itemIndex].qty <= 0) {
            cart.splice(itemIndex, 1);
        }

        saveCart(cart);
        renderCartTable(); // Re-render table to reflect updated cart
    };

    /**
     * Removes a specific item from the cart by its index.
     * @param {Event} event - Click event from Remove button
     */
    const removeCartItem = (event) => {
        const cart = getCart();
        const itemIndex = parseInt(event.target.dataset.idx, 10);

        cart.splice(itemIndex, 1); // Delete item at the given index
        saveCart(cart);
        renderCartTable();
    };

    // Clear entire cart on button click (with confirmation dialog)
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            const confirmed = window.confirm('Are you sure you want to empty your cart?');
            if (confirmed) {
                saveCart([]); // Replace cart with empty array
                renderCartTable();
            }
        });
    }

    // Initial render of cart table when page loads
    renderCartTable();

//SECTION 5 — CHECKOUT PAGE: Order Summary & Submission (page5)
//Displays a cart summary and processes the checkout form.
//On submit, opens a new confirmation tab with order details.
    const checkoutFormSection = document.getElementById('checkout-form-section');
    const checkoutEmptyMsg = document.getElementById('checkout-empty');
    const checkoutSummary = document.getElementById('checkout-summary');
    const checkoutItemsContainer = document.getElementById('checkout-items-container');
    const checkoutTotalDisplay = document.getElementById('checkout-total');
    const checkoutForm = document.getElementById('checkoutForm');

    if (checkoutForm) {
        const cart = getCart();

        // Conditional: check if cart is empty before rendering summary
        if (cart.length === 0) {
            // Hide form and summary; show empty state
            checkoutSummary.classList.add('hidden-section');
            checkoutEmptyMsg.classList.remove('hidden-section');
            checkoutFormSection.classList.add('hidden-section');
        } else {
            // Build order summary table from cart items
            let grandTotal = 0;
            let summaryHTML = `
                <table class="cart-table">
                    <thead>
                        <tr class="cart-thead-row">
                            <th>Item</th>
                            <th>Size</th>
                            <th>Qty</th>
                            <th class="text-right">Price</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            // Loop through each cart item to build summary rows
            cart.forEach(item => {
                const itemTotal = item.price * item.qty;
                grandTotal += itemTotal;

                summaryHTML += `
                    <tr class="cart-row">
                        <td class="cart-cell">${item.name}</td>
                        <td class="cart-cell">${item.size}</td>
                        <td class="cart-cell">${item.qty}</td>
                        <td class="cart-cell text-right">RM ${itemTotal.toFixed(2)}</td>
                    </tr>
                `;
            });

            summaryHTML += `</tbody></table>`;
            checkoutItemsContainer.innerHTML = summaryHTML;
            checkoutTotalDisplay.innerText = `RM ${grandTotal.toFixed(2)}`;
        }

        // Handle checkout form submission
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const currentCart = getCart();

            // Collect all form field values into a structured array
            const orderDetails = [
                ['Full Name',        document.getElementById('fullName').value],
                ['Email Address',    document.getElementById('userEmail').value],
                ['Phone Number',     document.getElementById('userContact').value],
                ['Delivery Address', document.getElementById('userAddress').value],
                ['Delivery Notes',   document.getElementById('deliveryNotes').value || 'N/A'],
                ['Payment Method',   document.getElementById('paymentMethod').value]
            ];

            // Append each ordered item to the details array
            currentCart.forEach((item, index) => {
                const itemSummary = `${item.name} (${item.size}) x${item.qty} — RM ${(item.price * item.qty).toFixed(2)}`;
                orderDetails.push([`Item ${index + 1}`, itemSummary]);
            });

            // Build table rows from the details array using a loop
            let tableRows = '';
            orderDetails.forEach(([label, value]) => {
                tableRows += `<tr><th>${label}</th><td>${value}</td></tr>`;
            });

            // Open a new blank tab and write the confirmation page into it
            const confirmationTab = window.open('', '_blank');
            confirmationTab.document.head.innerHTML = `
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Order Confirmed</title>
                <link rel="stylesheet" href="./css/styles.css">
            `;
            confirmationTab.document.body.innerHTML = `
                <div class="container py-20">
                    <h1 class="section-title">Order Placed! &#127881;</h1>
                    <p class="text-muted">Thank you for your purchase! Here is your order summary:</p>
                    <br>
                    <table class="summary-table">
                        <thead>
                            <tr><th>Detail</th><th>Information</th></tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                    <br>
                    <a href="index.html" class="btn">Return to Home</a>
                </div>
            `;

            // Clear cart after successful order
            localStorage.removeItem(CART_KEY);
        });
    }

//SECTION 6 — PROFILE PAGE: Registration Form (page4)
//Extracts all form inputs (text, radio, checkbox, select) and displays them in a summary table on a new tab
    const profileForm = document.getElementById('registrationForm');

    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent default form submission/reload

            //Extract Radio Button Value
            //querySelector returns null if nothing is checked, so we use optional chaining
            const selectedRadio = document.querySelector('input[name="shopCategory"]:checked');
            const shoppingPreference = selectedRadio ? selectedRadio.value : 'None selected';

            //Extract Checkbox Values
            const checkedNewsBoxes = document.querySelectorAll('input[name="newsletter"]:checked');
            let newsletterPreferences = '';

            // Conditional: check if any newsletter options were selected
            if (checkedNewsBoxes.length > 0) {
                // Loop through checked boxes and collect their values
                const selectedOptions = [];
                checkedNewsBoxes.forEach(checkbox => {
                    selectedOptions.push(checkbox.value);
                });
                newsletterPreferences = selectedOptions.join(', ');
            } else {
                // No checkboxes checked — user opted out
                newsletterPreferences = 'Opted out';
            }

            //Collect All Form Fields into a Structured Array
            //Each entry is a [label, value] pair used to build the table
            const profileData = [
                ['Full Name',           document.getElementById('fullName').value],
                ['Email Address',       document.getElementById('userEmail').value],
                ['Phone Number',        document.getElementById('userContact').value],
                ['Address',             document.getElementById('userAddress').value],
                ['Age',                 document.getElementById('userAge').value],
                ['Gender',              document.getElementById('userGender').value],
                ['Shopping Preference', shoppingPreference],
                ['Newsletter Signups',  newsletterPreferences],
                ['Bio / Notes',         document.getElementById('userBio').value || 'N/A']
            ];

            //Build Table Rows Using a Loop
            let tableRows = '';
            profileData.forEach(([label, value]) => {
                tableRows += `
                    <tr>
                        <th>${label}</th>
                        <td>${value}</td>
                    </tr>
                `;
            });

            //Open New Tab and Write Profile Summary Page
            const profileTab = window.open('', '_blank');

            // Set up the <head> of the new page
            profileTab.document.head.innerHTML = `
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Profile Saved</title>
                <link rel="stylesheet" href="./css/styles.css">
            `;

            // Write the profile summary table into the <body>
            profileTab.document.body.innerHTML = `
                <div class="container py-20">
                    <h1 class="section-title">Profile Saved! &#10003;</h1>
                    <p class="text-muted">Your profile information has been successfully updated.</p>
                    <br>
                    <table class="summary-table">
                        <thead>
                            <tr>
                                <th>Field</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                    <br>
                    <a href="page4.html" class="btn">&#8592; Back to Profile</a>
                </div>
            `;
        });
    }

}); // End DOMContentLoaded