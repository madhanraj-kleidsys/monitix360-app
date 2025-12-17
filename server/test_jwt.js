require("dotenv").config();
const jwt = require("jsonwebtoken");

const ACCESS = process.env.ACCESS_SECRET;
const REFRESH = process.env.REFRESH_SECRET;

console.log('ACCESS_SECRET length:', ACCESS ? ACCESS.length : 'UNDEFINED');
console.log('REFRESH_SECRET length:', REFRESH ? REFRESH.length : 'UNDEFINED');

if (!ACCESS || !REFRESH) {
    console.error("❌ Secrets are missing in .env!");
} else {
    // Test Sign/Verify
    const token = jwt.sign({ foo: 'bar' }, REFRESH, { expiresIn: '1d' });
    console.log('Generated Token:', token);

    try {
        const decoded = jwt.verify(token, REFRESH);
        console.log('✅ Verified:', decoded);
    } catch (e) {
        console.error('❌ Verification failed:', e.message);
    }
}
