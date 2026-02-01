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
        const image = product.image_url || 'https://via.placeholder.com/300x200?text=No+Image'; // Placeholder if empty
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
    if (modal.style.display === 'none') {
        modal.display = 'flex'; // Fix display type
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

    container.innerHTML = '';

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
            <div>
                <strong>${item.name}</strong>
                <div style="font-size: 0.8em;">${item.quantity} x ${price}</div>
            </div>
            <div style="font-weight: bold;">
                ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(item.total)}
            </div>
        `;
        container.appendChild(div);
    });

    totalDisplay.textContent = `Total: ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(data.total)}`;
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

        if (res.ok) {
            alert('¡Producto agregado al carrito!');
            // Optional: update cart count if we had one
        } else {
            alert('Error al agregar el producto.');
        }
    } catch (err) {
        console.error(err);
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

// --- Admin CRUD Logic ---

// Prepare form for Edit
window.editProduct = function (id, name, code, price, description) {
    document.getElementById('editProductId').value = id;
    document.getElementById('name').value = name;
    document.getElementById('code').value = code;
    document.getElementById('price').value = price;
    document.getElementById('description').value = description;

    // Change Button Text
    const submitBtn = document.querySelector('#createProductForm button[type="submit"]');
    submitBtn.textContent = 'Actualizar Producto';
    submitBtn.style.background = 'linear-gradient(to right, #11998e 0%, #38ef7d 100%)'; // Greenish for update

    // Add Cancel Button if not exists
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

    // Scroll to form
    document.getElementById('adminSection').scrollIntoView({ behavior: 'smooth' });
};

function resetForm() {
    document.getElementById('createProductForm').reset();
    document.getElementById('editProductId').value = '';

    // Reset Button
    const submitBtn = document.querySelector('#createProductForm button[type="submit"]');
    submitBtn.textContent = 'Publicar';
    submitBtn.style.background = ''; // Reset to class style

    // Remove Cancel Button
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.remove();
}

// Delete Product
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
