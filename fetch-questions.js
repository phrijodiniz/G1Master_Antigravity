const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://udoqomcvtxtxajzpfjty.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkb3FvbWN2dHh0eGFqenBmanR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQyMDIsImV4cCI6MjA4MTQ3MDIwMn0.R3SbEv2eridzQZoee5L2LZ4u4PWZpWe7pAmLsabVWn0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchQuestions() {
    console.log('Fetching questions...');

    const { data: signs, error: signsError } = await supabase
        .from('questions')
        .select('*')
        .eq('category', 'Road Signs')
        .limit(5);

    if (signsError) console.error('Signs error:', signsError);

    const { data: rules, error: rulesError } = await supabase
        .from('questions')
        .select('*')
        .eq('category', 'Rules of the Road')
        .limit(5);

    if (rulesError) console.error('Rules error:', rulesError);

    const allQuestions = [...(signs || []), ...(rules || [])];

    // Sort broadly to mix them? Or allow fixed order?
    // User said: "Questions must be mixed/randomized in order (not grouped by category)."
    // I'll shuffle them here once, and then save that order.

    const shuffled = allQuestions.sort(() => 0.5 - Math.random());

    console.log(JSON.stringify(shuffled, null, 2));

    fs.writeFileSync('src/lib/freeTestQuestions.json', JSON.stringify(shuffled, null, 2));
}

fetchQuestions();
