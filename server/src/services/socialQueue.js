import prisma from '../lib/prisma.js';
import { publishToSocialMedia, refreshExpiredTokens } from './socialService.js';



const CHECK_INTERVAL = 60000; // 60 seconds

// Process scheduled posts
async function processScheduledPosts() {
  try {
    const now = new Date();

    // Find scheduled posts that should be published
    const posts = await prisma.socialPost.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
      },
      include: {
        account: true,
      },
    });

    for (const post of posts) {
      try {
        console.log(`Publishing scheduled post: ${post.id} to ${post.account.platform}`);

        // Check if account token is expired
        if (post.account.tokenExpiry && new Date(post.account.tokenExpiry) < now) {
          console.log(`Token expired for ${post.account.platform} account`);
          await prisma.socialPost.update({
            where: { id: post.id },
            data: {
              status: 'FAILED',
              errorMessage: 'Account token expired. Please reconnect the account.',
            },
          });
          continue;
        }

        // Update status to publishing
        await prisma.socialPost.update({
          where: { id: post.id },
          data: { status: 'PUBLISHING' },
        });

        // Publish
        const result = await publishToSocialMedia(post, post.account);

        if (result.success) {
          await prisma.socialPost.update({
            where: { id: post.id },
            data: {
              status: 'PUBLISHED',
              publishedAt: new Date(),
              platformPostId: result.postId,
            },
          });
          console.log(`Successfully published post ${post.id} to ${post.account.platform}`);
        } else {
          await prisma.socialPost.update({
            where: { id: post.id },
            data: {
              status: 'FAILED',
              errorMessage: result.error,
            },
          });
          console.error(`Failed to publish post ${post.id}: ${result.error}`);
        }
      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error.message);
        await prisma.socialPost.update({
          where: { id: post.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error processing scheduled posts:', error);
  }
}

// Main queue processor
async function runQueue() {
  console.log('Social Queue processor running...');

  // Refresh expired tokens
  await refreshExpiredTokens();

  // Process scheduled posts
  await processScheduledPosts();
}

// Start the queue
export function startSocialQueue() {
  console.log('Starting Social Queue service');

  // Run immediately
  runQueue();

  // Then run periodically
  setInterval(runQueue, CHECK_INTERVAL);
}

export default { startSocialQueue };
