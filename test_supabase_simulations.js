const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function test() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });

    const { data: results, error } = await supabase.from('simulation_results').select('test_type');

    if (error) {
        console.error('Error fetching results:', error);
        return;
    }

    if (results && results.length > 0) {
        const types = new Set(results.map(r => r.test_type));
        console.log('Distinct test types found in all results:', Array.from(types));
    } else {
        console.log("No data found in simulation_results");
    }
}

test();
