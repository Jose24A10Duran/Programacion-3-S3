function loadCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const container = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');

    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = '<p>Tu carrito está vacío.</p>';
        totalEl.textContent = 'Total: $0.00';
        return;
    }

    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div style="display: flex; align-items: center;">
                <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 15px; border-radius: 5px;">
                <div>
                    <strong>${item.name}</strong><br>
                    $${item.price} x ${item.quantity}
                </div>
            </div>
            <div style="display: flex; align-items: center;">
                <strong style="margin-right: 15px;">$${itemTotal.toFixed(2)}</strong>
                <button onclick="removeFromCart(${item.id})" style="background: #dc3545; width: auto; padding: 5px 10px; font-size: 0.8em;">Eliminar</button>
            </div>
        `;
        container.appendChild(div);
    });

    totalEl.textContent = `Total: $${total.toFixed(2)}`;
}

function removeFromCart(id) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
}

function clearCart() {
    if (confirm('¿Estás seguro de vaciar el carrito?')) {
        localStorage.removeItem('cart');
        loadCart();
    }
}

function checkout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert('El carrito está vacío');
        return;
    }

    // Simulate checkout
    if (confirm(`Confirmar compra por ${document.getElementById('cartTotal').textContent}?`)) {
        alert('¡Compra realizada con éxito! Gracias por tu preferencia.');
        localStorage.removeItem('cart');
        window.location.href = 'products.html';
    }
}

// Load on start
loadCart();
