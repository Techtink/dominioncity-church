import prisma from '../lib/prisma.js';



// Rate limiting: 10 SMS per second
const SMS_RATE_LIMIT = 10;
const BATCH_SIZE = 100;
const CHECK_INTERVAL = 30000; // 30 seconds

// Get settings from database
async function getSettings() {
  const settings = await prisma.siteSetting.findMany();
  return settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});
}

// Send SMS using configured provider
async function sendSms(to, message, settings) {
  try {
    const provider = settings.sms_provider || 'twilio';

    if (provider === 'twilio') {
      const accountSid = settings.twilio_account_sid;
      const authToken = settings.twilio_auth_token;
      const fromNumber = settings.twilio_phone_number;

      if (!accountSid || !authToken || !fromNumber) {
        return { success: false, error: 'Twilio not configured' };
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
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.message || 'Twilio error' };
      }
    }

    if (provider === 'africas_talking') {
      const username = settings.africas_talking_username;
      const apiKey = settings.africas_talking_api_key;

      if (!username || !apiKey) {
        return { success: false, error: "Africa's Talking not configured" };
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
        return { success: true };
      }
      return { success: false, error: "Africa's Talking error" };
    }

    if (provider === 'termii') {
      const apiKey = settings.termii_api_key;
      const senderId = settings.termii_sender_id;

      if (!apiKey || !senderId) {
        return { success: false, error: 'Termii not configured' };
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
        return { success: true };
      }
      return { success: false, error: 'Termii error' };
    }

    return { success: false, error: 'No SMS provider configured' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Process a batch of recipients
async function processBatch(recipients, message, settings) {
  const results = [];

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];

    // Rate limiting: wait if we've sent SMS_RATE_LIMIT messages
    if (i > 0 && i % SMS_RATE_LIMIT === 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const result = await sendSms(recipient.phone, message, settings);

    await prisma.sMSRecipient.update({
      where: { id: recipient.id },
      data: {
        status: result.success ? 'SENT' : 'FAILED',
        sentAt: result.success ? new Date() : null,
        errorMessage: result.error || null,
      },
    });

    results.push({
      id: recipient.id,
      success: result.success,
    });
  }

  return results;
}

// Process scheduled campaigns
async function processScheduledCampaigns() {
  try {
    const now = new Date();

    // Find scheduled campaigns that should start
    const campaigns = await prisma.sMSCampaign.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
      },
    });

    for (const campaign of campaigns) {
      console.log(`Starting scheduled SMS campaign: ${campaign.name}`);

      // Update to processing and populate recipients
      await prisma.sMSCampaign.update({
        where: { id: campaign.id },
        data: {
          status: 'PROCESSING',
          startedAt: new Date(),
        },
      });

      // Populate recipients based on target type
      let recipientData = [];

      if (campaign.targetType === 'ALL_MEMBERS') {
        const members = await prisma.memberProfile.findMany({
          where: { phone: { not: null } },
          select: { phone: true, userId: true, user: { select: { firstName: true, lastName: true } } },
        });
        recipientData = members.map(m => ({
          phone: m.phone,
          name: `${m.user.firstName} ${m.user.lastName}`,
          userId: m.userId,
          campaignId: campaign.id,
        }));
      } else if (campaign.targetType === 'MINISTRY' && campaign.targetId) {
        const members = await prisma.memberProfile.findMany({
          where: {
            phone: { not: null },
            ministries: { some: { id: campaign.targetId } },
          },
          select: { phone: true, userId: true, user: { select: { firstName: true, lastName: true } } },
        });
        recipientData = members.map(m => ({
          phone: m.phone,
          name: `${m.user.firstName} ${m.user.lastName}`,
          userId: m.userId,
          campaignId: campaign.id,
        }));
      } else if (campaign.targetType === 'EVENT_REGISTRANTS' && campaign.targetId) {
        const registrations = await prisma.eventRegistration.findMany({
          where: {
            eventId: campaign.targetId,
            phone: { not: null },
          },
          select: { phone: true, name: true, userId: true },
        });
        recipientData = registrations.map(r => ({
          phone: r.phone,
          name: r.name,
          userId: r.userId,
          campaignId: campaign.id,
        }));
      }

      if (recipientData.length > 0) {
        await prisma.sMSRecipient.createMany({
          data: recipientData,
        });

        await prisma.sMSCampaign.update({
          where: { id: campaign.id },
          data: { totalRecipients: recipientData.length },
        });
      }
    }
  } catch (error) {
    console.error('Error processing scheduled campaigns:', error);
  }
}

// Process pending messages for campaigns in PROCESSING status
async function processPendingMessages() {
  try {
    const settings = await getSettings();

    // Find campaigns that are processing
    const campaigns = await prisma.sMSCampaign.findMany({
      where: { status: 'PROCESSING' },
    });

    for (const campaign of campaigns) {
      // Check if cancelled
      const current = await prisma.sMSCampaign.findUnique({
        where: { id: campaign.id },
      });

      if (current.status === 'CANCELLED') {
        continue;
      }

      // Get pending recipients in batches
      const pendingRecipients = await prisma.sMSRecipient.findMany({
        where: {
          campaignId: campaign.id,
          status: 'PENDING',
        },
        take: BATCH_SIZE,
      });

      if (pendingRecipients.length === 0) {
        // All done, mark as completed
        const counts = await prisma.sMSRecipient.groupBy({
          by: ['status'],
          where: { campaignId: campaign.id },
          _count: true,
        });

        const sentCount = counts.find(c => c.status === 'SENT')?._count || 0;
        const failedCount = counts.find(c => c.status === 'FAILED')?._count || 0;

        await prisma.sMSCampaign.update({
          where: { id: campaign.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            sentCount,
            failedCount,
          },
        });

        console.log(`SMS campaign completed: ${campaign.name} (${sentCount} sent, ${failedCount} failed)`);
        continue;
      }

      // Process this batch
      console.log(`Processing ${pendingRecipients.length} messages for campaign: ${campaign.name}`);
      await processBatch(pendingRecipients, campaign.message, settings);

      // Update sent/failed counts
      const counts = await prisma.sMSRecipient.groupBy({
        by: ['status'],
        where: { campaignId: campaign.id },
        _count: true,
      });

      const sentCount = counts.find(c => c.status === 'SENT')?._count || 0;
      const failedCount = counts.find(c => c.status === 'FAILED')?._count || 0;

      await prisma.sMSCampaign.update({
        where: { id: campaign.id },
        data: { sentCount, failedCount },
      });
    }
  } catch (error) {
    console.error('Error processing pending messages:', error);
  }
}

// Main queue processor
async function runQueue() {
  console.log('SMS Queue processor running...');

  // Process scheduled campaigns first
  await processScheduledCampaigns();

  // Then process pending messages
  await processPendingMessages();
}

// Start the queue
export function startSmsQueue() {
  console.log('Starting SMS Queue service');

  // Run immediately
  runQueue();

  // Then run periodically
  setInterval(runQueue, CHECK_INTERVAL);
}

export default { startSmsQueue };
