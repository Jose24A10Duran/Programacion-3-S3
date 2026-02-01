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
