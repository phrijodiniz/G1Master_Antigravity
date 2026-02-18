const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://udoqomcvtxtxajzpfjty.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkb3FvbWN2dHh0eGFqenBmanR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQyMDIsImV4cCI6MjA4MTQ3MDIwMn0.R3SbEv2eridzQZoee5L2LZ4u4PWZpWe7pAmLsabVWn0';

const customFetch = async (url, options) => {
    console.log('Custom Fetch calling:', url);
    console.log('Options:', JSON.stringify(options, null, 2));
    try {
        // Check if fetch handles these options
        const res = await fetch(url, options);
        console.log('Fetch response status:', res.status);
        return res;
    } catch (e) {
        console.error('Fetch error inside customFetch:', e);
        throw e;
    }
};

const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
        fetch: customFetch
    },
    realtime: { enabled: false }, // disable realtime to isolate REST
    auth: { persistSession: false }
});

async function testConnection() {
    console.log('Testing with custom fetch...');
    try {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (error) {
            console.log('Supabase error:', error);
        } else {
            console.log('Supabase success:', data);
        }
    } catch (e) {
        console.error('Top level exception:', e);
    }
}

testConnection();
