import fetch from 'node-fetch';

async function seedData() {
    const baseUrl = 'http://localhost:3000/api/activity';
    
    // Helper to generate dates relative to now
    function getOffsetDate(hoursOffset) {
        const d = new Date();
        d.setHours(d.getHours() + hoursOffset);
        // Format as YYYY-MM-DD HH:MM:SS for Google Sheets friendliness
        return d.toISOString().replace('T', ' ').substring(0, 19);
    }

    const testUsers = [
        // User 1: Signs up, takes 1 test within 24 hours (SHOULD MATCH FORMULA)
        { email: 'user1_match@test.com', name: 'Alice Match', events: [
            { type: 'User Signed Up', offset: -48 }, // Signed up 48 hours ago
            { type: 'Practice (Road Signs) Completed - Score: 80%', offset: -40 } // Took 1 test 8 hours later
        ]},
        // User 2: Signs up, takes 3 tests within 24 hours (TOO MANY TESTS)
        { email: 'user2_toomany@test.com', name: 'Bob Multi', events: [
            { type: 'User Signed Up', offset: -30 }, 
            { type: 'Simulation Completed - Score: 60%', offset: -29 },
            { type: 'Practice (Rules) Completed - Score: 70%', offset: -28 },
            { type: 'Simulation Completed - Score: 90%', offset: -27 }
        ]},
        // User 3: Signs up, takes 0 tests (NO TESTS)
        { email: 'user3_zero@test.com', name: 'Charlie Zero', events: [
            { type: 'User Signed Up', offset: -10 }
        ]},
        // User 4: Signs up, takes 2 tests within 24 hours (SHOULD MATCH FORMULA)
        { email: 'user4_match@test.com', name: 'David Match', events: [
            { type: 'User Signed Up', offset: -72 },
            { type: 'Practice (Rules) Completed - Score: 100%', offset: -60 },
            { type: 'Simulation Completed - Score: 85%', offset: -50 } 
        ]},
        // User 5: Signs up, takes 1 test but AFTER 24 hours (TOO LATE)
        { email: 'user5_toolate@test.com', name: 'Eve Late', events: [
            { type: 'User Signed Up', offset: -100 },
            { type: 'Practice (Road Signs) Completed - Score: 60%', offset: -50 } // 50 hours later
        ]}
    ];

    console.log("Seeding data to Google Sheet...");

    for (const user of testUsers) {
        for (const event of user.events) {
            const timestamp = getOffsetDate(event.offset);
            const payload = {
                eventData: [timestamp, user.email, user.name, event.type]
            };
            
            try {
                const res = await fetch(baseUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (res.ok) {
                    console.log(`✅ Seeded: ${user.email} -> ${event.type}`);
                } else {
                    console.error(`❌ Failed: ${user.email} -> ${event.type}`, await res.text());
                }
            } catch (err) {
                console.error(`Error connecting to local server:`, err.message);
                return;
            }
            
            // Wait 1 second between requests to avoid google api rate limits
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    console.log("Finished seeding!");
}

seedData();
