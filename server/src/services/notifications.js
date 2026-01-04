import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get settings from database
async function getSettings() {
  const settings = await prisma.siteSetting.findMany();
  return settings.reduce((acc, s) => {
    let value = s.value;
    if (s.type === 'boolean') value = s.value === 'true';
    acc[s.key] = value;
    return acc;
  }, {});
}

// Create email transporter based on settings
async function createEmailTransporter(settings) {
  const provider = settings.email_provider || 'smtp';

  if (provider === 'smtp') {
    return nodemailer.createTransport({
      host: settings.smtp_host,
      port: parseInt(settings.smtp_port) || 587,
      secure: parseInt(settings.smtp_port) === 465,
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_password,
      },
    });
  }

  if (provider === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: settings.sendgrid_api_key,
      },
    });
  }

  if (provider === 'mailgun') {
    return nodemailer.createTransport({
      host: `smtp.mailgun.org`,
      port: 587,
      auth: {
        user: `postmaster@${settings.mailgun_domain}`,
        pass: settings.mailgun_api_key,
      },
    });
  }

  return null;
}

// Send email notification
async function sendEmailNotification(to, subject, html, settings) {
  try {
    const transporter = await createEmailTransporter(settings);
    if (!transporter) {
      console.log('Email not configured');
      return false;
    }

    await transporter.sendMail({
      from: `"${settings.smtp_from_name || 'Church Website'}" <${settings.smtp_from_email || 'noreply@church.com'}>`,
      to,
      subject,
      html,
    });

    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return false;
  }
}

// Send SMS notification
async function sendSmsNotification(to, message, settings) {
  try {
    const provider = settings.sms_provider || 'twilio';

    if (provider === 'twilio') {
      const accountSid = settings.twilio_account_sid;
      const authToken = settings.twilio_auth_token;
      const fromNumber = settings.twilio_phone_number;

      if (!accountSid || !authToken || !fromNumber) {
        console.log('Twilio not configured');
        return false;
      }

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: to,
            From: fromNumber,
            Body: message,
          }),
        }
      );

      if (response.ok) {
        console.log(`SMS sent to ${to}`);
        return true;
      } else {
        const error = await response.json();
        console.error('Twilio error:', error.message);
        return false;
      }
    }

    if (provider === 'africas_talking') {
      const username = settings.africas_talking_username;
      const apiKey = settings.africas_talking_api_key;

      if (!username || !apiKey) {
        console.log("Africa's Talking not configured");
        return false;
      }

      const response = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'apiKey': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          username,
          to,
          message,
        }),
      });

      if (response.ok) {
        console.log(`SMS sent to ${to}`);
        return true;
      }
      return false;
    }

    if (provider === 'termii') {
      const apiKey = settings.termii_api_key;
      const senderId = settings.termii_sender_id;

      if (!apiKey || !senderId) {
        console.log('Termii not configured');
        return false;
      }

      const response = await fetch('https://api.ng.termii.com/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          from: senderId,
          sms: message,
          type: 'plain',
          channel: 'generic',
          api_key: apiKey,
        }),
      });

      if (response.ok) {
        console.log(`SMS sent to ${to}`);
        return true;
      }
      return false;
    }

    return false;
  } catch (error) {
    console.error('SMS sending failed:', error.message);
    return false;
  }
}

// Send chat notification to all configured recipients
export async function sendChatNotification(visitorName, visitorEmail, message) {
  try {
    const settings = await getSettings();

    // Check if notifications are enabled
    if (!settings.chat_notification_enabled) {
      console.log('Chat notifications disabled');
      return;
    }

    const siteName = settings.site_name || 'Church Website';
    const emailSubject = settings.chat_email_subject || 'New Chat Message from Website Visitor';
    const notificationEmails = settings.chat_notification_emails || '';
    const notificationPhones = settings.chat_notification_phones || '';

    // Email notification
    if (notificationEmails) {
      const emails = notificationEmails.split(',').map(e => e.trim()).filter(Boolean);

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1e293b; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">${siteName}</h1>
          </div>
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #1e293b; margin-top: 0;">New Chat Message</h2>
            <p style="color: #64748b;">A visitor is requesting to chat on your website.</p>

            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px;"><strong>Name:</strong> ${visitorName}</p>
              <p style="margin: 0 0 10px;"><strong>Email:</strong> ${visitorEmail || 'Not provided'}</p>
              <p style="margin: 0;"><strong>Message:</strong></p>
              <p style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 10px 0 0;">${message}</p>
            </div>

            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/chat"
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Reply to Chat
            </a>
          </div>
          <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
            This is an automated notification from ${siteName}
          </div>
        </div>
      `;

      for (const email of emails) {
        await sendEmailNotification(email, emailSubject, emailHtml, settings);
      }
    }

    // SMS notification
    if (notificationPhones) {
      const phones = notificationPhones.split(',').map(p => p.trim()).filter(Boolean);
      const smsMessage = `[${siteName}] New chat from ${visitorName}: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`;

      for (const phone of phones) {
        await sendSmsNotification(phone, smsMessage, settings);
      }
    }
  } catch (error) {
    console.error('Failed to send chat notification:', error);
  }
}

export default { sendChatNotification };
