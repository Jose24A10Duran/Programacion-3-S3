const http = require('http');

function post(path, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, body: body });
            });
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

const run = async () => {
    try {
        console.log('--- Starting Verification ---');

        // Register
        const registerData = JSON.stringify({
            name: 'Test User ' + Date.now(),
            email: 'test' + Date.now() + '@example.com',
            password: 'password123',
            level: 'admin'
        });
        console.log('Testing Register...');
        const regRes = await post('/api/auth/register', registerData);
        console.log(`Register Status: ${regRes.status}`);
        console.log(`Register Body: ${regRes.body}`);

        // Login (using the same creds)
        const loginData = JSON.stringify({
            email: JSON.parse(registerData).email,
            password: 'password123'
        });
        console.log('Testing Login...');
        const loginRes = await post('/api/auth/login', loginData);
        console.log(`Login Status: ${loginRes.status}`);
        console.log(`Login Body: ${loginRes.body}`);

        console.log('--- Verification Complete ---');
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

// Start immediately
run();
