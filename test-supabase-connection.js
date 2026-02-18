const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://udoqomcvtxtxajzpfjty.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkb3FvbWN2dHh0eGFqenBmanR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQyMDIsImV4cCI6MjA4MTQ3MDIwMn0.R3SbEv2eridzQZoee5L2LZ4u4PWZpWe7pAmLsabVWn0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('users').select('*').limit(1); // 'users' is a guess, but if it fails with 404 or connection refused, that's what we want to know.
    // Actually, let's try auth.getSession to be safer as it doesn't depend on table existence.
    const { data: authData, error: authError } = await supabase.auth.getSession();

    if (authError) {
        console.error('Auth check error:', authError);
    } else {
        console.log('Auth check successful.');
    }

    // Also try a query if we can find a public table later.
}

testConnection();
