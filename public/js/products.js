const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'index.html';
}

async function fetchProducts() {
    try {
        const res = await fetch('/api/products');
        const products = await res.json();

        displayProducts(products);
    } catch (err) {
        console.error(err);
    }
}

function displayProducts(products) {
    const productList = document.getElementById('productList');
    productList.innerHTML = '';

    if (products.length === 0) {
        productList.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No hay productos disponibles.</p>';
        return;
    }

    products.forEach(product => {
        const div = document.createElement('div');
        div.className = 'product-card';
        // Use a placeholder if no image provided
        const image = product.image_url || 'https://via.placeholder.com/300x200?text=No+Image';

        div.innerHTML = `
            <img src="${image}" alt="${product.name}" class="product-image">
            <div class="product-details">
                <h3 class="product-title">${product.name}</h3>
                <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">Código: ${product.code}</div>
                <div class="product-price">$${product.price}</div>
                ${product.description ? `<p style="font-size: 0.9em; color: #555; flex-grow: 1;">${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}</p>` : '<div style="flex-grow: 1;"></div>'}
                
                ${product.stock > 0 ?
                `<button class="add-to-cart-btn" onclick="addToCart(${product.id}, '${product.name}', ${product.price}, '${image}')">AGREGAR AL CARRITO</button>` :
                `<button disabled style="background: #ccc; cursor: not-allowed;">AGOTADO</button>`
            }
            </div>
        `;
        productList.appendChild(div);
    });
}

async function searchProduct() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!query) {
        fetchProducts();
        return;
    }

    // Client side filtering for simplicity and responsiveness with existing API
    try {
        const res = await fetch('/api/products');
        const products = await res.json();

        const filtered = products.filter(p =>
            p.code.toLowerCase().includes(query) ||
            p.name.toLowerCase().includes(query)
        );

        displayProducts(filtered);
    } catch (err) {
        console.error(err);
    }
}

function addToCart(id, name, price, image) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existing = cart.find(item => item.id === id);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, image, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount(); // Function defined in HTML or we can define it here if strict
    // alert('Producto agregado!');

    // Simple toast notification could go here
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = '¡AGREGADO!';
    btn.style.background = '#28a745';
    btn.style.color = 'white';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.color = '';
    }, 1000);
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    const countEl = document.getElementById('cartCount');
    if (countEl) countEl.textContent = count;
}

// Load products on page load
fetchProducts();
