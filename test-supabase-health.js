const url = 'https://udoqomcvtxtxajzpfjty.supabase.co';

async function checkHealth() {
    const services = [
        { name: 'Auth', path: '/auth/v1/health' },
        { name: 'Rest', path: '/rest/v1/' }, // PostgREST root usually returns Swagger/OpenAPI or 404 but tells us it's listening
    ];

    for (const service of services) {
        const serviceUrl = `${url}${service.path}`;
        console.log(`Checking ${service.name} at ${serviceUrl}...`);
        try {
            const res = await fetch(serviceUrl);
            console.log(`${service.name} Status: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.log(`${service.name} Response: ${text.substring(0, 100)}...`);
        } catch (error) {
            console.error(`${service.name} Error:`, error);
        }
    }
}

checkHealth();
