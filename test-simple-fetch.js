const url = 'https://udoqomcvtxtxajzpfjty.supabase.co';

async function testFetch() {
    console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status}`);
        console.log(`StatusText: ${res.statusText}`);
        const text = await res.text();
        console.log(`Body length: ${text.length}`);
        console.log('Fetch successful!');
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testFetch();
