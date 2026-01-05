import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = express.Router();


// Get all connected social accounts
router.get('/accounts', authenticate, adminOnly, async (req, res, next) => {
  try {
    const accounts = await prisma.socialAccount.findMany({
      where: { isActive: true },
      select: {
        id: true,
        platform: true,
        accountName: true,
        accountId: true,
        tokenExpiry: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: { accounts } });
  } catch (error) {
    next(error);
  }
});

// Get OAuth URL for connecting a platform
router.get('/accounts/:platform/connect', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { platform } = req.params;
    const settings = await getSettings();
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    const redirectUri = `${baseUrl}/api/social/accounts/${platform}/callback`;

    let authUrl;

    switch (platform.toUpperCase()) {
      case 'FACEBOOK':
      case 'INSTAGRAM': {
        const appId = settings.meta_app_id;
        if (!appId) {
          return res.status(400).json({ error: { message: 'Meta App ID not configured' } });
        }
        // Facebook/Instagram uses same OAuth flow
        const scopes = platform === 'INSTAGRAM'
          ? 'instagram_basic,instagram_content_publish,pages_show_list'
          : 'pages_show_list,pages_read_engagement,pages_manage_posts';
        authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${platform}`;
        break;
      }

      case 'TWITTER': {
        const apiKey = settings.twitter_api_key;
        if (!apiKey) {
          return res.status(400).json({ error: { message: 'Twitter API key not configured' } });
        }
        // Twitter OAuth 2.0 with PKCE
        const codeChallenge = Buffer.from(Math.random().toString(36)).toString('base64').slice(0, 43);
        authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${apiKey}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=${platform}&code_challenge=${codeChallenge}&code_challenge_method=plain`;
        break;
      }

      case 'TIKTOK': {
        const clientKey = settings.tiktok_client_key;
        if (!clientKey) {
          return res.status(400).json({ error: { message: 'TikTok client key not configured' } });
        }
        authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=user.info.basic,video.publish&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${platform}`;
        break;
      }

      default:
        return res.status(400).json({ error: { message: 'Invalid platform' } });
    }

    res.json({ data: { authUrl } });
  } catch (error) {
    next(error);
  }
});

// OAuth callback handler
router.get('/accounts/:platform/callback', async (req, res, next) => {
  try {
    const { platform } = req.params;
    const { code, state, error: oauthError } = req.query;

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    if (oauthError) {
      return res.redirect(`${clientUrl}/admin/social?error=${encodeURIComponent(oauthError)}`);
    }

    if (!code) {
      return res.redirect(`${clientUrl}/admin/social?error=no_code`);
    }

    const settings = await getSettings();
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    const redirectUri = `${baseUrl}/api/social/accounts/${platform}/callback`;

    let accessToken, refreshToken, tokenExpiry, accountId, accountName;

    switch (platform.toUpperCase()) {
      case 'FACEBOOK':
      case 'INSTAGRAM': {
        // Exchange code for token
        const tokenResponse = await fetch(
          `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${settings.meta_app_id}&client_secret=${settings.meta_app_secret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
        );
        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          return res.redirect(`${clientUrl}/admin/social?error=${encodeURIComponent(tokenData.error.message)}`);
        }

        // Get long-lived token
        const longTokenResponse = await fetch(
          `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${settings.meta_app_id}&client_secret=${settings.meta_app_secret}&fb_exchange_token=${tokenData.access_token}`
        );
        const longTokenData = await longTokenResponse.json();
        accessToken = longTokenData.access_token;
        tokenExpiry = new Date(Date.now() + (longTokenData.expires_in || 5184000) * 1000);

        // Get user/page info
        const meResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}`);
        const meData = await meResponse.json();
        accountId = meData.id;
        accountName = meData.name;

        if (platform.toUpperCase() === 'INSTAGRAM') {
          // Get Instagram business account connected to pages
          const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
          const pagesData = await pagesResponse.json();
          if (pagesData.data && pagesData.data[0]) {
            const pageId = pagesData.data[0].id;
            const igResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`);
            const igData = await igResponse.json();
            if (igData.instagram_business_account) {
              accountId = igData.instagram_business_account.id;
              accountName = `Instagram (${pagesData.data[0].name})`;
            }
          }
        }
        break;
      }

      case 'TWITTER': {
        // Exchange code for token
        const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${settings.twitter_api_key}:${settings.twitter_api_secret}`).toString('base64'),
          },
          body: new URLSearchParams({
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
            code_verifier: 'challenge',
          }),
        });
        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          return res.redirect(`${clientUrl}/admin/social?error=${encodeURIComponent(tokenData.error_description || tokenData.error)}`);
        }

        accessToken = tokenData.access_token;
        refreshToken = tokenData.refresh_token;
        tokenExpiry = new Date(Date.now() + (tokenData.expires_in || 7200) * 1000);

        // Get user info
        const userResponse = await fetch('https://api.twitter.com/2/users/me', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        const userData = await userResponse.json();
        accountId = userData.data.id;
        accountName = `@${userData.data.username}`;
        break;
      }

      case 'TIKTOK': {
        // Exchange code for token
        const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_key: settings.tiktok_client_key,
            client_secret: settings.tiktok_client_secret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
          }),
        });
        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          return res.redirect(`${clientUrl}/admin/social?error=${encodeURIComponent(tokenData.error.message || tokenData.error)}`);
        }

        accessToken = tokenData.access_token;
        refreshToken = tokenData.refresh_token;
        tokenExpiry = new Date(Date.now() + (tokenData.expires_in || 86400) * 1000);
        accountId = tokenData.open_id;
        accountName = `TikTok User`;

        // Get user info
        const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        const userData = await userResponse.json();
        if (userData.data?.user) {
          accountName = userData.data.user.display_name || accountName;
        }
        break;
      }
    }

    // Save or update account
    await prisma.socialAccount.upsert({
      where: {
        platform_accountId: {
          platform: platform.toUpperCase(),
          accountId,
        },
      },
      update: {
        accountName,
        accessToken,
        refreshToken,
        tokenExpiry,
        isActive: true,
      },
      create: {
        platform: platform.toUpperCase(),
        accountId,
        accountName,
        accessToken,
        refreshToken,
        tokenExpiry,
        isActive: true,
      },
    });

    res.redirect(`${clientUrl}/admin/social?success=connected`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/admin/social?error=${encodeURIComponent(error.message)}`);
  }
});

// Disconnect social account
router.delete('/accounts/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    await prisma.socialAccount.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
});

// Get all posts
router.get('/posts', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { status, accountId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (accountId) where.accountId = accountId;

    const [posts, total] = await Promise.all([
      prisma.socialPost.findMany({
        where,
        include: {
          account: {
            select: { id: true, platform: true, accountName: true },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.socialPost.count({ where }),
    ]);

    res.json({
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create post
router.post('/posts', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { accountId, content, mediaUrls, mediaType, scheduledAt } = req.body;

    if (!accountId || !content) {
      return res.status(400).json({ error: { message: 'Account and content are required' } });
    }

    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || !account.isActive) {
      return res.status(404).json({ error: { message: 'Account not found or inactive' } });
    }

    const post = await prisma.socialPost.create({
      data: {
        content,
        mediaUrls: mediaUrls || [],
        mediaType,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        accountId,
        createdById: req.user.id,
      },
      include: {
        account: {
          select: { id: true, platform: true, accountName: true },
        },
      },
    });

    res.status(201).json({ data: { post } });
  } catch (error) {
    next(error);
  }
});

// Update post
router.patch('/posts/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { content, mediaUrls, mediaType, scheduledAt } = req.body;

    const existing = await prisma.socialPost.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: { message: 'Post not found' } });
    }

    if (existing.status !== 'DRAFT' && existing.status !== 'SCHEDULED') {
      return res.status(400).json({ error: { message: 'Can only edit draft or scheduled posts' } });
    }

    const post = await prisma.socialPost.update({
      where: { id: req.params.id },
      data: {
        ...(content && { content }),
        ...(mediaUrls && { mediaUrls }),
        ...(mediaType !== undefined && { mediaType }),
        ...(scheduledAt !== undefined && {
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        }),
      },
      include: {
        account: {
          select: { id: true, platform: true, accountName: true },
        },
      },
    });

    res.json({ data: { post } });
  } catch (error) {
    next(error);
  }
});

// Delete post
router.delete('/posts/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const existing = await prisma.socialPost.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: { message: 'Post not found' } });
    }

    if (existing.status === 'PUBLISHED') {
      return res.status(400).json({ error: { message: 'Cannot delete published posts' } });
    }

    await prisma.socialPost.delete({
      where: { id: req.params.id },
    });

    res.json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
});

// Schedule post
router.post('/posts/:id/schedule', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { scheduledAt } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({ error: { message: 'Scheduled time is required' } });
    }

    const existing = await prisma.socialPost.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: { message: 'Post not found' } });
    }

    if (existing.status !== 'DRAFT' && existing.status !== 'SCHEDULED') {
      return res.status(400).json({ error: { message: 'Can only schedule draft or scheduled posts' } });
    }

    const post = await prisma.socialPost.update({
      where: { id: req.params.id },
      data: {
        status: 'SCHEDULED',
        scheduledAt: new Date(scheduledAt),
      },
    });

    res.json({ data: { post } });
  } catch (error) {
    next(error);
  }
});

// Publish post now
router.post('/posts/:id/publish', authenticate, adminOnly, async (req, res, next) => {
  try {
    const existing = await prisma.socialPost.findUnique({
      where: { id: req.params.id },
      include: { account: true },
    });

    if (!existing) {
      return res.status(404).json({ error: { message: 'Post not found' } });
    }

    if (existing.status !== 'DRAFT' && existing.status !== 'SCHEDULED') {
      return res.status(400).json({ error: { message: 'Post cannot be published' } });
    }

    // Import publish function
    const { publishToSocialMedia } = await import('../services/socialService.js');
    const result = await publishToSocialMedia(existing, existing.account);

    if (result.success) {
      const post = await prisma.socialPost.update({
        where: { id: req.params.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          platformPostId: result.postId,
        },
      });
      res.json({ data: { post } });
    } else {
      await prisma.socialPost.update({
        where: { id: req.params.id },
        data: {
          status: 'FAILED',
          errorMessage: result.error,
        },
      });
      res.status(500).json({ error: { message: result.error } });
    }
  } catch (error) {
    next(error);
  }
});

// Get calendar data
router.get('/calendar', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    const posts = await prisma.socialPost.findMany({
      where: {
        OR: [
          {
            scheduledAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            publishedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        ],
      },
      include: {
        account: {
          select: { id: true, platform: true, accountName: true },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    res.json({ data: { posts } });
  } catch (error) {
    next(error);
  }
});

// Helper function to get settings
async function getSettings() {
  const settings = await prisma.siteSetting.findMany();
  return settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});
}

export default router;
