import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        console.log('Attempting to send email...');
        console.log('GMAIL_USER present:', !!process.env.GMAIL_USER);
        console.log('GMAIL_APP_PASSWORD present:', !!process.env.GMAIL_APP_PASSWORD);

        const body = await req.json();
        const { name, email, message, source, userId, userEmail, userName } = body;

        // Basic validation
        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        if (source === 'public' && (!name || !email)) {
            return NextResponse.json(
                { error: 'Name and Email are required' },
                { status: 400 }
            );
        }

        // Configure Transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        // Construct Email Content based on Source
        let subject = 'New Message from G1 Master App';
        let htmlContent = '';

        if (source === 'authenticated') {
            subject = `[User Support] Message from ${userName || 'User'} (${userEmail})`;
            htmlContent = `
                <h3>New Authenticated User Message</h3>
                <p><strong>User:</strong> ${userName} (${userEmail})</p>
                <p><strong>User ID:</strong> ${userId || 'N/A'}</p>
                <hr />
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `;
        } else {
            subject = `[Public Contact] Message from ${name}`;
            htmlContent = `
                <h3>New Public Visitor Message</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <hr />
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `;
        }

        // Send Email
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: 'g1masterapp@gmail.com', // Always send to this address
            replyTo: source === 'authenticated' ? userEmail : email,
            subject: subject,
            html: htmlContent,
        });

        return NextResponse.json({ success: true, message: 'Email sent successfully' }, { status: 200 });

    } catch (error) {
        console.error('Error sending email (Full Error):', error);
        return NextResponse.json(
            { error: 'Failed to send email' },
            { status: 500 }
        );
    }
}
