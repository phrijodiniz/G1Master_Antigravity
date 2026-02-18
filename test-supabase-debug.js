const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://udoqomcvtxtxajzpfjty.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkb3FvbWN2dHh0eGFqenBmanR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQyMDIsImV4cCI6MjA4MTQ3MDIwMn0.R3SbEv2eridzQZoee5L2LZ4u4PWZpWe7pAmLsabVWn0';

// Initialize with realtime disabled to test if that's the cause
const supabase = createClient(supabaseUrl, supabaseKey, {
    realtime: {
        enabled: false
    },
    auth: {
        persistSession: false // Don't try to load/save session from storage
    }
});

async function testConnection() {
    console.log('1. Starting test...');

    try {
        console.log('2. Calling getSession...');
        const { data, error } = await supabase.auth.getSession();
        console.log('3. getSession returned.');

        if (error) {
            console.error('Auth error:', error.message);
        } else {
            console.log('Auth session data:', data.session ? 'Session found' : 'No session');
        }

        // Try a REST query
        console.log('4. Calling REST query...');
        // We don't know a valid table, so we expect an error, but it should return (not hang).
        const { data: tableData, error: tableError } = await supabase.from('users').select('count').limit(1);
        console.log('5. REST query returned.');

        if (tableError) {
            console.log('REST error (expected if table missing/RLS):', tableError.message);
        } else {
            console.log('REST success.');
        }

    } catch (e) {
        console.error('Exception:', e);
    }

    console.log('6. Test finished.');
}

testConnection();
