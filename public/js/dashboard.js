// Check authentication
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/index.html';
}

// Get user info
const userStr = localStorage.getItem('user');
if (userStr) {
    const user = JSON.parse(userStr);
    document.getElementById('welcomeMsg').textContent = `Bienvenido, ${user.name}`;
    document.getElementById('roleDisplay').textContent = `Rol: ${user.level.toUpperCase()}`;
} else {
    // Force logout if user data is missing
    logout();
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
}
