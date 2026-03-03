import fetch from 'node-fetch';
import crypto from 'crypto';

async function testSignupApi() {
    const randomEmail = `test_${crypto.randomBytes(4).toString('hex')}@test.com`;
    console.log(`Testing signup payload for: ${randomEmail}`);
    
    // Test the exact fetch call the client makes
    try {
        const payload = {
            eventData: [
                new Date().toISOString(),
                randomEmail,
                "TestUser",
                "User Signed Up"
            ]
        };
        
        console.log("Sending payload:", JSON.stringify(payload));
        
        const res = await fetch('http://localhost:3000/api/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const text = await res.text();
        console.log(`API Status: ${res.status}`);
        console.log(`API Response: ${text}`);
    } catch (err) {
        console.error("Test failed:", err);
    }
}

testSignupApi();
