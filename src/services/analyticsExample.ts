export const mockAcquisitionData = {
    summary: {
        totalSpend: 1250.00,
        marketingSpend: 850.00,
        blendedCac: 4.25,
        organicSignups: 154,
        paidSignups: 82,
        totalSignups: 236
    },
    trafficSources: [
        { source: 'Google Ads', visitors: 1250, signups: 65, cost: 650.00 },
        { source: 'Organic Search', visitors: 3400, signups: 110, cost: 0 },
        { source: 'Direct', visitors: 800, signups: 40, cost: 0 },
        { source: 'Social (Meta)', visitors: 600, signups: 15, cost: 150.00 },
        { source: 'Referral', visitors: 150, signups: 6, cost: 0 }
    ],
    dailyTrends: Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
            date: date.toISOString().split('T')[0],
            signups: Math.floor(Math.random() * 40) + 10, // Random between 10 and 50
            spend: Math.floor(Math.random() * 100) + 50
        };
    }),
    funnel: {
        impressions: 45000,
        clicks: 3200,
        visits: 2800,
        signups: 236
    },
    funnelVariants: {
        all: { impressions: 45000, clicks: 3200, visits: 2800, signups: 236 },
        mobile: { impressions: 28000, clicks: 2100, visits: 1800, signups: 145 },
        desktop: { impressions: 17000, clicks: 1100, visits: 1000, signups: 91 },
        day: { impressions: 1500, clicks: 120, visits: 95, signups: 8 },
        week: { impressions: 10500, clicks: 840, visits: 665, signups: 56 },
        month: { impressions: 45000, clicks: 3200, visits: 2800, signups: 236 }
    },
    breakdownData: {
        device: [
            { segment: 'Mobile', impressions: 28000, clicks: 2100, visits: 1800, signups: 145 },
            { segment: 'Desktop', impressions: 17000, clicks: 1100, visits: 1000, signups: 91 }
        ],
        source: [
            { segment: 'Google Ads', impressions: 25000, clicks: 1800, visits: 1250, signups: 65 },
            { segment: 'Organic Search', impressions: 12000, clicks: 900, visits: 3400, signups: 110 }, // High visits/impressions ratio for organic
            { segment: 'Social (Meta)', impressions: 5000, clicks: 300, visits: 600, signups: 15 },
            { segment: 'Direct', impressions: 3000, clicks: 200, visits: 800, signups: 40 }
        ],
        day: [
            { segment: 'Oct 24', impressions: 1500, clicks: 120, visits: 95, signups: 8 },
            { segment: 'Oct 25', impressions: 1450, clicks: 115, visits: 90, signups: 7 },
            { segment: 'Oct 26', impressions: 1600, clicks: 130, visits: 100, signups: 9 },
            { segment: 'Oct 27', impressions: 1550, clicks: 125, visits: 98, signups: 8 },
            { segment: 'Oct 28', impressions: 1480, clicks: 118, visits: 92, signups: 7 },
            { segment: 'Oct 29', impressions: 1520, clicks: 122, visits: 96, signups: 8 },
            { segment: 'Oct 30', impressions: 1580, clicks: 128, visits: 99, signups: 9 }
        ],
        week: [
            { segment: 'Week 1', impressions: 10500, clicks: 840, visits: 665, signups: 56 },
            { segment: 'Week 2', impressions: 11000, clicks: 880, visits: 700, signups: 60 },
            { segment: 'Week 3', impressions: 10800, clicks: 860, visits: 680, signups: 58 },
            { segment: 'Week 4', impressions: 12700, clicks: 620, visits: 755, signups: 62 }
        ],
        month: [
            { segment: 'September', impressions: 42000, clicks: 3000, visits: 2600, signups: 210 },
            { segment: 'October', impressions: 45000, clicks: 3200, visits: 2800, signups: 236 }
        ]
    }
};

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};
