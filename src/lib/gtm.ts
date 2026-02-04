
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-WS7NZ35R';

export const pageview = (url: string) => {
    if (typeof window.dataLayer !== 'undefined') {
        window.dataLayer.push({
            event: 'pageview',
            page: url,
        });
    }
};

export const sendGTMEvent = (eventName: string, eventDetails: object = {}) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
            event: eventName,
            ...eventDetails,
        });
    } else {
        console.warn("GTM: dataLayer not defined");
    }
};

declare global {
    interface Window {
        dataLayer: any[];
    }
}
