import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
    console.log("Testing full signup flow with Supabase + Activity Logging");
    
    const email = `test_flow_${Date.now()}@test.com`;
    const password = 'Password123!';
    const firstName = 'TestFlow';
    const lastName = 'User';

    // 1. Supabase Signup
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: firstName,
                last_name: lastName
            }
        }
    });

    if (error) {
        console.error("Supabase Error:", error);
        return;
    }

    console.log("Supabase Success:", !!data.user);

    // 2. Fetch logging (simulating AuthContext)
    try {
        console.log("Sending payload to /api/activity...");
        const res = await fetch('http://localhost:3000/api/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventData: [
                    new Date().toISOString(),
                    email,
                    firstName,
                    "User Signed Up"
                ]
            })
        });
        const text = await res.text();
        console.log(`API Status: ${res.status}`);
        console.log(`API Response: ${text}`);
    } catch (err) {
        console.error("Activity API Error:", err);
    }
}

testSignup();
