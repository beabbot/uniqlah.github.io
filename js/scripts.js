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
});

