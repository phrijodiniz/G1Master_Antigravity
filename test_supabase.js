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

    const { data: usersData, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    const { users } = usersData;
    console.log(`Fetched ${users.length} users.`);
    if (users.length > 0) {
        console.log('Sample user identities:', JSON.stringify(users[0].identities, null, 2));
        console.log('Sample user app_metadata:', JSON.stringify(users[0].app_metadata, null, 2));

        let googleCount = 0;
        let emailCount = 0;
        let otherCount = 0;

        users.forEach(user => {
            const provider = user.app_metadata.provider || (user.identities && user.identities.length > 0 ? user.identities[0].provider : 'unknown');
            if (provider === 'google') googleCount++;
            else if (provider === 'email') emailCount++;
            else otherCount++;
        });

        console.log(`Breakdown: Email=${emailCount}, Google=${googleCount}, Other=${otherCount}`);
    }
}

test();
