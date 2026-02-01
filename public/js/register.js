document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const level = document.querySelector('input[name="level"]:checked').value;
    const errorMsg = document.getElementById('errorMsg');

    // Reset error
    errorMsg.style.display = 'none';
    errorMsg.textContent = '';

    if (password !== confirmPassword) {
        errorMsg.textContent = 'Las contraseñas no coinciden';
        errorMsg.style.display = 'block';
        // Add a small animation to indicate error
        document.querySelector('.container').animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(0)' }
        ], {
            duration: 300
        });
        return;
    }

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, level })
        });

        const data = await res.json();

        if (res.ok) {
            alert('Registro exitoso. Ahora puedes iniciar sesión.');
            window.location.href = '/';
        } else {
            errorMsg.textContent = data.msg || 'Error al registrarse';
            errorMsg.style.display = 'block';
        }
    } catch (err) {
        console.error(err);
        errorMsg.textContent = 'Error de conexión con el servidor';
        errorMsg.style.display = 'block';
    }
});
