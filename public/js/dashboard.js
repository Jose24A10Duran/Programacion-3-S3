// Check authentication
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/index.html';
}

let currentUser = null; // Store user locally for role checks
const userStr = localStorage.getItem('user');
if (userStr) {
    currentUser = JSON.parse(userStr);
    document.getElementById('userGreeting').textContent = `Hola, ${currentUser.name}`;

    // Show admin section if admin
    if (currentUser.level === 'admin') {
        document.getElementById('adminSection').style.display = 'block';
    }
} else {
    logout();
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
}

// --- Product Logic ---

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
        productList.innerHTML = '<p>No hay productos disponibles.</p>';
        return;
    }

    products.forEach(product => {
        const div = document.createElement('div');
        div.className = 'product-card';
        const image = product.image_url || 'https://via.placeholder.com/300x200?text=No+Image';
        const priceFormatted = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(product.price);

        let adminActions = '';
        if (currentUser && currentUser.level === 'admin') {
            adminActions = `
                <div style="margin-top: 10px; display: flex; gap: 10px;">
                    <button onclick="editProduct(${product.id}, '${product.name}', '${product.code}', ${product.price}, '${escapeHtml(product.description || '')}')" style="background: #ffc107; color: #333; padding: 5px 10px; font-size: 0.8em; flex: 1;">Editar</button>
                    <button onclick="deleteProduct(${product.id})" style="background: #dc3545; color: white; padding: 5px 10px; font-size: 0.8em; flex: 1;">Borrar</button>
                </div>
            `;
        } else {
            // User actions
            adminActions = `
                <button onclick="addToCart(${product.id})" style="background: #fff; color: #764ba2; margin-top: 10px; width: 100%; font-size: 0.9em;">
                    <i class="fas fa-cart-plus"></i> Agregar
                </button>
            `;
        }

        div.innerHTML = `
            <img src="${image}" alt="${product.name}" class="product-image">
            <div class="product-details">
                <div class="product-price">${priceFormatted}</div>
                <h3 class="product-title">${product.name}</h3>
                <p style="font-size: 0.8em; color: #eee; margin-top: 5px;">Cod: ${product.code}</p>
                <p style="font-size: 0.85em; color: #ddd; margin-top: 5px;">${product.description ? product.description.substring(0, 60) + (product.description.length > 60 ? '...' : '') : ''}</p>
                ${adminActions}
            </div>
        `;
        productList.appendChild(div);
    });
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Search Logic
async function searchProduct() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    try {
        const res = await fetch('/api/products');
        let products = await res.json();
        if (query) {
            products = products.filter(p =>
                p.code.toLowerCase().includes(query) ||
                p.name.toLowerCase().includes(query)
            );
        }
        displayProducts(products);
    } catch (err) {
        console.error(err);
    }
}

// --- Cart Logic ---

async function toggleCart() {
    const modal = document.getElementById('cartModal');
    // Check computed style to be safe
    if (modal.style.display === 'none' || getComputedStyle(modal).display === 'none') {
        modal.style.display = 'flex';
        await loadCart();
    } else {
        modal.style.display = 'none';
    }
}

async function loadCart() {
    try {
        const res = await fetch('/api/cart', {
            headers: { 'x-auth-token': token }
        });
        const data = await res.json();
        renderCart(data);
    } catch (err) {
        console.error(err);
    }
}

function renderCart(data) {
    const container = document.getElementById('cartItemsContainer');
    const totalDisplay = document.getElementById('cartTotalDisplay');
    const paypalContainer = document.getElementById('paypal-button-container');

    container.innerHTML = '';
    paypalContainer.innerHTML = '';

    if (data.items.length === 0) {
        container.innerHTML = '<p>Tu carrito está vacío.</p>';
        totalDisplay.textContent = 'Total: $0.00';
        return;
    }

    data.items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item-row';
        const price = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(item.price);

        div.innerHTML = `
            <div class="cart-item-info">
                <strong>${item.name}</strong>
                <span>${item.quantity} x ${price}</span>
            </div>
            <div class="cart-item-total">
                ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(item.total)}
            </div>
        `;
        container.appendChild(div);
    });

    totalDisplay.textContent = `Total: ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(data.total)}`;

    // Render PayPal Button
    const totalUSD = (data.total / 1000).toFixed(2);

    if (window.paypal) {
        window.paypal.Buttons({
            createOrder: function (data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: totalUSD
                        }
                    }]
                });
            },
            onApprove: function (data, actions) {
                return actions.order.capture().then(async function (details) {
                    alert('Pago realizado por ' + details.payer.name.given_name);
                    await createOrderBackend();
                });
            },
            onError: function (err) {
                console.error('PayPal Error:', err);
                alert('Hubo un error con el pago.');
            }
        }).render('#paypal-button-container');
    }
}

async function createOrderBackend() {
    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'x-auth-token': token }
        });
        const data = await res.json();
        if (res.ok) {
            alert('Orden guardada exitosamente!');
            toggleCart(); // Close cart
            loadCart(); // Refresh (should be empty)
        } else {
            alert('Error al guardar orden: ' + data.msg);
        }
    } catch (err) {
        console.error(err);
    }
}

window.addToCart = async function (productId) {
    try {
        const res = await fetch('/api/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ productId })
        });

        const data = await res.json(); // Parse response

        if (res.ok) {
            alert('¡Producto agregado al carrito!');
        } else {
            alert('Error: ' + (data.msg || data.error || JSON.stringify(data)));
        }
    } catch (err) {
        console.error(err);
        alert('Error de conexión al agregar carrito.');
    }
};

window.clearCart = async function () {
    if (!confirm('¿Seguro que quieres vaciar el carrito?')) return;
    try {
        const res = await fetch('/api/cart', {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });
        if (res.ok) loadCart();
    } catch (err) {
        console.error(err);
    }
};

// --- Orders Logic ---

window.toggleOrders = async function () {
    const modal = document.getElementById('ordersModal');
    if (modal.style.display === 'none' || getComputedStyle(modal).display === 'none') {
        modal.style.display = 'flex';
        await loadOrders();
    } else {
        modal.style.display = 'none';
    }
}

async function loadOrders() {
    const container = document.getElementById('ordersContainer');
    container.innerHTML = 'Cargando...';

    try {
        const res = await fetch('/api/orders', {
            headers: { 'x-auth-token': token }
        });
        const orders = await res.json();

        container.innerHTML = '';
        if (orders.length === 0) {
            container.innerHTML = '<p>No tienes compras realizadas.</p>';
            return;
        }

        orders.forEach(order => {
            const date = new Date(order.createdAt).toLocaleDateString();
            const total = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(order.total);
            const div = document.createElement('div');
            div.className = 'cart-item-row';
            div.style.flexDirection = 'column';
            div.style.alignItems = 'flex-start';

            let itemsHtml = order.OrderItems.map(item =>
                `<li>${item.quantity} x ${item.Product ? item.Product.name : 'Producto'}</li>`
            ).join('');

            div.innerHTML = `
                <div style="width: 100%; display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 5px;">
                    <strong>Orden #${order.id}</strong>
                    <span>${date}</span>
                </div>
                <ul style="padding-left: 20px; font-size: 0.9em; color: #555; margin: 5px 0;">
                    ${itemsHtml}
                </ul>
                <div style="width: 100%; text-align: right; font-weight: bold; color: #764ba2;">
                    Total: ${total}
                </div>
            `;
            container.appendChild(div);
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = 'Error al cargar historial.';
    }
}

// --- Admin CRUD Logic ---

// Prepare form for Edit
window.editProduct = function (id, name, code, price, description) {
    document.getElementById('editProductId').value = id;
    document.getElementById('name').value = name;
    document.getElementById('code').value = code;
    document.getElementById('price').value = price;
    document.getElementById('description').value = description;

    const submitBtn = document.querySelector('#createProductForm button[type="submit"]');
    submitBtn.textContent = 'Actualizar Producto';
    submitBtn.style.background = 'linear-gradient(to right, #11998e 0%, #38ef7d 100%)';

    if (!document.getElementById('cancelEditBtn')) {
        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancelEditBtn';
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.type = 'button';
        cancelBtn.style.background = '#6c757d';
        cancelBtn.style.marginLeft = '10px';
        cancelBtn.onclick = resetForm;
        submitBtn.parentNode.insertBefore(cancelBtn, submitBtn.nextSibling);
    }

    document.getElementById('adminSection').scrollIntoView({ behavior: 'smooth' });
};

function resetForm() {
    document.getElementById('createProductForm').reset();
    document.getElementById('editProductId').value = '';

    const submitBtn = document.querySelector('#createProductForm button[type="submit"]');
    submitBtn.textContent = 'Publicar';
    submitBtn.style.background = '';

    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.remove();
}

window.deleteProduct = async function (id) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
        const res = await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });

        if (res.ok) {
            alert('Producto eliminado');
            fetchProducts();
        } else {
            alert('Error al eliminar producto');
        }
    } catch (err) {
        console.error(err);
    }
};

const createForm = document.getElementById('createProductForm');
if (createForm) {
    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('editProductId').value;
        const name = document.getElementById('name').value;
        const code = document.getElementById('code').value;
        const price = document.getElementById('price').value;
        const description = document.getElementById('description').value;
        const msgDiv = document.getElementById('message');

        if (price <= 0) {
            msgDiv.className = 'error';
            msgDiv.textContent = 'El precio debe ser mayor a 0';
            return;
        }

        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/products/${id}` : '/api/products';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ name, code, price, description })
            });

            const data = await res.json();

            if (res.ok) {
                msgDiv.className = 'success';
                msgDiv.textContent = id ? '¡Producto actualizado!' : '¡Producto publicado exitosamente!';
                resetForm(); // Reset form and mode
                fetchProducts(); // Refresh grid
                setTimeout(() => { msgDiv.textContent = ''; }, 3000);
            } else {
                msgDiv.className = 'error';
                const errorDetail = data.msg || data.error || JSON.stringify(data);
                msgDiv.textContent = `Error: ${errorDetail}`;
            }
        } catch (err) {
            console.error('Fetch error:', err);
            msgDiv.textContent = 'Error de conexión. Revisa la consola.';
        }
    });
}

// Load products
fetchProducts();
