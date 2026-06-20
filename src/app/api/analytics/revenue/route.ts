import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getAcquisitionDataFromSheet } from '@/services/sheets'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        if (!startDate || !endDate) {
            return NextResponse.json({ error: 'Missing startDate or endDate parameters' }, { status: 400 })
        }

        console.log('API /api/analytics/revenue called with:', { startDate, endDate })

        const [startY, startM, startD] = startDate.split('-').map(Number)
        const startSecs = Math.floor(new Date(startY, startM - 1, startD, 0, 0, 0).getTime() / 1000)

        const [endY, endM, endD] = endDate.split('-').map(Number)
        const endSecs = Math.floor(new Date(endY, endM - 1, endD, 23, 59, 59).getTime() / 1000)

        console.log('API Date Bounds (Secs):', { startSecs, endSecs, startDateStr: new Date(startSecs * 1000).toISOString(), endDateStr: new Date(endSecs * 1000).toISOString() })

        // 1. Fetch Google Sheet Acquisition data for marketing cost
        const sheetData = await getAcquisitionDataFromSheet(startDate, endDate)
        const totalAdSpend = sheetData?.summary?.totalSpend || 0

        // 2. Fetch all Stripe checkout sessions (with pagination)
        let sessions: any[] = []
        let hasMore = true
        let startingAfter: string | undefined = undefined

        while (hasMore) {
            const params: any = { limit: 100 }
            if (startingAfter) {
                params.starting_after = startingAfter
            }
            const response = await stripe.checkout.sessions.list(params)
            sessions = sessions.concat(response.data)
            if (response.has_more && response.data.length > 0) {
                startingAfter = response.data[response.data.length - 1].id
            } else {
                hasMore = false
            }
        }

        console.log(`API Stripe Total Sessions fetched: ${sessions.length}`)

        // 3. Fetch all Stripe refunds (with pagination)
        let refunds: any[] = []
        let hasMoreRefunds = true
        let startingAfterRefund: string | undefined = undefined

        while (hasMoreRefunds) {
            const params: any = { limit: 100 }
            if (startingAfterRefund) {
                params.starting_after = startingAfterRefund
            }
            const response = await stripe.refunds.list(params)
            refunds = refunds.concat(response.data)
            if (response.has_more && response.data.length > 0) {
                startingAfterRefund = response.data[response.data.length - 1].id
            } else {
                hasMoreRefunds = false
            }
        }

        console.log(`API Stripe Total Refunds fetched: ${refunds.length}`)

        // 4. Filter sessions and refunds within the date range
        const filteredSessions = sessions.filter(s => {
            return s.payment_status === 'paid' && s.created >= startSecs && s.created <= endSecs
        })

        const filteredRefunds = refunds.filter(r => {
            return r.created >= startSecs && r.created <= endSecs
        })

        console.log(`API Stripe Filtered Paid Sessions: ${filteredSessions.length}`)
        console.log(`API Stripe Filtered Refunds: ${filteredRefunds.length}`)
        if (filteredSessions.length > 0) {
            console.log('Sample filtered session:', { id: filteredSessions[0].id, created: filteredSessions[0].created, date: new Date(filteredSessions[0].created * 1000).toISOString() })
        }

        // 5. Seed daily map to ensure all dates are present in trend timeline
        const dailyMap = new Map<string, any>()
        const currentDate = new Date(startY, startM - 1, startD)
        const limitDate = new Date(endY, endM - 1, endD)

        while (currentDate <= limitDate) {
            const dStr = currentDate.toLocaleDateString('en-CA')
            dailyMap.set(dStr, {
                date: dStr,
                revenue: 0,
                marketingCost: 0,
                stripeFees: 0,
                profit: 0,
                count: 0
            })
            currentDate.setDate(currentDate.getDate() + 1)
        }

        // Populate marketing cost from Sheets data
        if (sheetData && sheetData.breakdownData && sheetData.breakdownData.day) {
            sheetData.breakdownData.day.forEach((day: any) => {
                const dStr = day.date
                if (dailyMap.has(dStr)) {
                    dailyMap.get(dStr).marketingCost = day.spend || 0
                }
            })
        }

        // 6. Aggregate checkout sessions into daily data and create transaction ledger
        const transactionLedger: any[] = []
        let totalGross = 0
        let totalStripeFees = 0
        const promoDistribution: { [key: string]: number } = {}

        filteredSessions.forEach(session => {
            const dateStr = new Date(session.created * 1000).toLocaleDateString('en-CA')
            const amount = (session.amount_total || 0) / 100 // in CAD
            const fees = Math.round((amount * 0.029 + 0.30) * 100) / 100 // 2.9% + $0.30 CAD

            totalGross += amount
            totalStripeFees += fees

            if (dailyMap.has(dateStr)) {
                const day = dailyMap.get(dateStr)
                day.revenue += amount
                day.stripeFees += fees
                day.count += 1
            }

            // Extract promo code
            let couponCode = 'Full Price'
            if (session.discounts && session.discounts.length > 0) {
                const disc = session.discounts[0]
                if (disc.coupon) {
                    couponCode = disc.coupon.id || disc.coupon.name || 'Promo'
                }
            }

            promoDistribution[couponCode] = (promoDistribution[couponCode] || 0) + 1

            transactionLedger.push({
                id: session.id,
                date: new Date(session.created * 1000).toISOString(),
                email: session.customer_details?.email || session.customer_email || 'unknown',
                status: 'Paid',
                coupon: couponCode,
                gross: amount,
                fees: fees,
                net: amount - fees
            })
        })

        // 7. Aggregate refunds
        let totalRefunded = 0
        filteredRefunds.forEach(refund => {
            const dateStr = new Date(refund.created * 1000).toLocaleDateString('en-CA')
            const amount = (refund.amount || 0) / 100 // in CAD

            totalRefunded += amount

            if (dailyMap.has(dateStr)) {
                const day = dailyMap.get(dateStr)
                day.revenue -= amount
            }

            transactionLedger.push({
                id: refund.id,
                date: new Date(refund.created * 1000).toISOString(),
                email: 'N/A (Refund)',
                status: 'Refunded',
                coupon: 'N/A',
                gross: -amount,
                fees: 0,
                net: -amount
            })
        })

        // Calculate daily profit metrics
        dailyMap.forEach(day => {
            day.profit = Math.round((day.revenue - day.marketingCost - day.stripeFees) * 100) / 100
            day.revenue = Math.round(day.revenue * 100) / 100
            day.marketingCost = Math.round(day.marketingCost * 100) / 100
            day.stripeFees = Math.round(day.stripeFees * 100) / 100
        })

        // 8. Financial aggregates
        const totalNetRevenue = totalGross - totalRefunded
        const totalOutflow = totalAdSpend + totalStripeFees
        const netProfit = totalNetRevenue - totalOutflow
        const totalPaidConversions = filteredSessions.length

        const aov = totalPaidConversions > 0 ? Math.round((totalGross / totalPaidConversions) * 100) / 100 : 0
        const cac = totalPaidConversions > 0 ? Math.round((totalAdSpend / totalPaidConversions) * 100) / 100 : 0
        const roas = totalAdSpend > 0 ? Math.round((totalNetRevenue / totalAdSpend) * 100) / 100 : 0

        // Sort transaction ledger by date descending
        transactionLedger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        return NextResponse.json({
            summary: {
                totalGross,
                totalRefunded,
                totalNetRevenue,
                totalAdSpend,
                totalStripeFees,
                totalOutflow,
                netProfit,
                totalPaidConversions,
                aov,
                cac,
                roas
            },
            promoDistribution: Object.entries(promoDistribution).map(([name, value]) => ({ name, value })),
            dailyTrends: Array.from(dailyMap.values()),
            ledger: transactionLedger
        })

    } catch (err: any) {
        console.error('Unexpected error in checkout direct info:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
