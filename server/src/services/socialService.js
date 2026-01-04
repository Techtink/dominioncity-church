import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get settings from database
async function getSettings() {
  const settings = await prisma.siteSetting.findMany();
  return settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});
}

// Publish to Facebook
async function publishToFacebook(post, account) {
  try {
    const { content, mediaUrls } = post;
    const { accessToken, accountId } = account;

    let endpoint;
    let body;

    // For pages, we need to get the page access token
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );
    const pagesData = await pagesResponse.json();

    if (!pagesData.data || !pagesData.data[0]) {
      return { success: false, error: 'No Facebook page found' };
    }

    const pageAccessToken = pagesData.data[0].access_token;
    const pageId = pagesData.data[0].id;

    if (mediaUrls && mediaUrls.length > 0) {
      // Post with photo
      endpoint = `https://graph.facebook.com/v18.0/${pageId}/photos`;
      body = new URLSearchParams({
        url: mediaUrls[0],
        message: content,
        access_token: pageAccessToken,
      });
    } else {
      // Text-only post
      endpoint = `https://graph.facebook.com/v18.0/${pageId}/feed`;
      body = new URLSearchParams({
        message: content,
        access_token: pageAccessToken,
      });
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const data = await response.json();

    if (data.error) {
      return { success: false, error: data.error.message };
    }

    return { success: true, postId: data.id || data.post_id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Publish to Instagram
async function publishToInstagram(post, account) {
  try {
    const { content, mediaUrls, mediaType } = post;
    const { accessToken, accountId } = account;

    if (!mediaUrls || mediaUrls.length === 0) {
      return { success: false, error: 'Instagram requires at least one media item' };
    }

    // Step 1: Create container
    const containerEndpoint = `https://graph.facebook.com/v18.0/${accountId}/media`;
    const containerParams = new URLSearchParams({
      caption: content,
      access_token: accessToken,
    });

    if (mediaType === 'video') {
      containerParams.append('media_type', 'VIDEO');
      containerParams.append('video_url', mediaUrls[0]);
    } else {
      containerParams.append('image_url', mediaUrls[0]);
    }

    const containerResponse = await fetch(containerEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: containerParams,
    });

    const containerData = await containerResponse.json();

    if (containerData.error) {
      return { success: false, error: containerData.error.message };
    }

    // Step 2: Publish container
    const publishEndpoint = `https://graph.facebook.com/v18.0/${accountId}/media_publish`;
    const publishResponse = await fetch(publishEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        creation_id: containerData.id,
        access_token: accessToken,
      }),
    });

    const publishData = await publishResponse.json();

    if (publishData.error) {
      return { success: false, error: publishData.error.message };
    }

    return { success: true, postId: publishData.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Publish to Twitter
async function publishToTwitter(post, account) {
  try {
    const { content, mediaUrls } = post;
    const { accessToken } = account;

    let mediaIds = [];

    // Upload media if present
    if (mediaUrls && mediaUrls.length > 0) {
      // Note: Twitter media upload requires different endpoint and is complex
      // For simplicity, we'll just post text for now
      // Full media upload would require the v1.1 upload endpoint
    }

    const tweetData = { text: content };
    if (mediaIds.length > 0) {
      tweetData.media = { media_ids: mediaIds };
    }

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetData),
    });

    const data = await response.json();

    if (data.errors || data.error) {
      return { success: false, error: data.errors?.[0]?.message || data.error || 'Twitter error' };
    }

    return { success: true, postId: data.data?.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Publish to TikTok
async function publishToTiktok(post, account) {
  try {
    const { content, mediaUrls, mediaType } = post;
    const { accessToken } = account;

    if (!mediaUrls || mediaUrls.length === 0 || mediaType !== 'video') {
      return { success: false, error: 'TikTok requires a video' };
    }

    // Step 1: Initialize upload
    const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: content.substring(0, 150),
          privacy_level: 'MUTUAL_FOLLOW_FRIENDS',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: mediaUrls[0],
        },
      }),
    });

    const initData = await initResponse.json();

    if (initData.error) {
      return { success: false, error: initData.error.message };
    }

    return { success: true, postId: initData.data?.publish_id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Main publish function
export async function publishToSocialMedia(post, account) {
  switch (account.platform) {
    case 'FACEBOOK':
      return publishToFacebook(post, account);
    case 'INSTAGRAM':
      return publishToInstagram(post, account);
    case 'TWITTER':
      return publishToTwitter(post, account);
    case 'TIKTOK':
      return publishToTiktok(post, account);
    default:
      return { success: false, error: 'Unknown platform' };
  }
}

// Refresh expired tokens
export async function refreshExpiredTokens() {
  try {
    const settings = await getSettings();
    const expiringSoon = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const accounts = await prisma.socialAccount.findMany({
      where: {
        isActive: true,
        refreshToken: { not: null },
        tokenExpiry: { lt: expiringSoon },
      },
    });

    for (const account of accounts) {
      try {
        let newAccessToken, newRefreshToken, newExpiry;

        switch (account.platform) {
          case 'TWITTER': {
            const response = await fetch('https://api.twitter.com/2/oauth2/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${settings.twitter_api_key}:${settings.twitter_api_secret}`).toString('base64'),
              },
              body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: account.refreshToken,
              }),
            });
            const data = await response.json();
            if (data.access_token) {
              newAccessToken = data.access_token;
              newRefreshToken = data.refresh_token;
              newExpiry = new Date(Date.now() + (data.expires_in || 7200) * 1000);
            }
            break;
          }

          case 'TIKTOK': {
            const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                client_key: settings.tiktok_client_key,
                client_secret: settings.tiktok_client_secret,
                grant_type: 'refresh_token',
                refresh_token: account.refreshToken,
              }),
            });
            const data = await response.json();
            if (data.access_token) {
              newAccessToken = data.access_token;
              newRefreshToken = data.refresh_token;
              newExpiry = new Date(Date.now() + (data.expires_in || 86400) * 1000);
            }
            break;
          }
        }

        if (newAccessToken) {
          await prisma.socialAccount.update({
            where: { id: account.id },
            data: {
              accessToken: newAccessToken,
              ...(newRefreshToken && { refreshToken: newRefreshToken }),
              tokenExpiry: newExpiry,
            },
          });
          console.log(`Refreshed token for ${account.platform} account: ${account.accountName}`);
        }
      } catch (error) {
        console.error(`Failed to refresh token for ${account.platform} account:`, error.message);
      }
    }
  } catch (error) {
    console.error('Token refresh error:', error);
  }
}

export default { publishToSocialMedia, refreshExpiredTokens };
