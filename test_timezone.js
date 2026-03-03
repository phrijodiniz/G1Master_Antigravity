const dateObj = new Date("2026-02-27T01:43:44.000Z");

const localTimeString = dateObj.toLocaleString('en-CA', {
    timeZone: 'America/Toronto', 
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
});

const formatted = localTimeString.replace(/,/g, '');
console.log("Original UTC:", dateObj.toISOString());
console.log("Formatted EST (en-CA):", formatted);

// Let's also check en-GB to see if it varies significantly
const gbString = dateObj.toLocaleString('en-GB', {
    timeZone: 'America/Toronto', 
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
});
console.log("Formatted EST (en-GB):", gbString.replace(/,/g, ''));
