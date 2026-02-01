const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

// Double check level just in case, though API protects it too
if (!token || user.level !== 'admin') {
    window.location.href = 'dashboard.html';
}

document.getElementById('createProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const code = document.getElementById('code').value;
    const price = document.getElementById('price').value;
    const stock = document.getElementById('stock').value;
    const image_url = document.getElementById('image_url').value;
    const description = document.getElementById('description').value;

    try {
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ name, code, price, stock, image_url, description })
        });

        const data = await res.json();

        if (res.ok) {
            document.getElementById('message').className = 'success'; // You might need to add this class in CSS
            document.getElementById('message').style.color = 'green';
            document.getElementById('message').textContent = 'Producto creado exitosamente';
            document.getElementById('createProductForm').reset();
        } else {
            document.getElementById('message').className = 'error';
            document.getElementById('message').style.color = 'red';
            document.getElementById('message').textContent = data.msg || 'Error al crear producto';
        }
    } catch (err) {
        console.error(err);
        document.getElementById('message').textContent = 'Server Error';
    }
});
