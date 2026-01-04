import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@church.com' },
    update: {},
    create: {
      email: 'admin@church.com',
      password: adminPassword,
      name: 'Church Admin',
      role: 'ADMIN',
    },
  });
  console.log('Created admin user:', admin.email);

  // Create editor user
  const editorPassword = await bcrypt.hash('editor123', 12);
  const editor = await prisma.user.upsert({
    where: { email: 'editor@church.com' },
    update: {},
    create: {
      email: 'editor@church.com',
      password: editorPassword,
      name: 'Content Editor',
      role: 'EDITOR',
    },
  });
  console.log('Created editor user:', editor.email);

  // Create categories
  const categories = [
    { name: 'Announcements', slug: 'announcements', description: 'Church announcements and updates' },
    { name: 'Devotionals', slug: 'devotionals', description: 'Daily devotionals and reflections' },
    { name: 'Testimonies', slug: 'testimonies', description: 'Member testimonies and stories' },
    { name: 'News', slug: 'news', description: 'Church news and community updates' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('Created blog categories');

  // Create giving categories
  const givingCategories = [
    { name: 'Tithes', description: 'Regular tithes' },
    { name: 'Offerings', description: 'General offerings' },
    { name: 'Building Fund', description: 'Church building and maintenance' },
    { name: 'Missions', description: 'Support for missionaries and outreach' },
    { name: 'Benevolence', description: 'Help for those in need' },
  ];

  for (const cat of givingCategories) {
    await prisma.givingCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log('Created giving categories');

  // Create ministries
  const ministries = [
    { name: 'Worship Team', slug: 'worship-team', description: 'Lead the congregation in worship through music', meetingTime: 'Saturdays 4:00 PM' },
    { name: 'Children\'s Ministry', slug: 'childrens-ministry', description: 'Teaching and caring for children ages 0-12', meetingTime: 'Sundays during service' },
    { name: 'Youth Ministry', slug: 'youth-ministry', description: 'Building faith in teenagers and young adults', meetingTime: 'Fridays 6:00 PM' },
    { name: 'Hospitality', slug: 'hospitality', description: 'Welcoming guests and serving the church community', meetingTime: 'Sundays before service' },
    { name: 'Outreach', slug: 'outreach', description: 'Community service and evangelism', meetingTime: 'First Saturday of each month' },
    { name: 'Prayer Team', slug: 'prayer-team', description: 'Interceding for the church and community', meetingTime: 'Wednesdays 6:00 AM' },
  ];

  for (const ministry of ministries) {
    await prisma.ministry.upsert({
      where: { slug: ministry.slug },
      update: {},
      create: ministry,
    });
  }
  console.log('Created ministries');

  // Create sample series
  const series = await prisma.series.upsert({
    where: { slug: 'faith-foundations' },
    update: {},
    create: {
      name: 'Faith Foundations',
      slug: 'faith-foundations',
      description: 'Building a strong foundation in the Christian faith',
    },
  });
  console.log('Created sermon series');

  // Create sample sermon
  await prisma.sermon.upsert({
    where: { slug: 'the-power-of-faith' },
    update: {},
    create: {
      title: 'The Power of Faith',
      slug: 'the-power-of-faith',
      description: 'Exploring how faith can move mountains in our lives',
      speaker: 'Pastor John',
      scripture: 'Hebrews 11:1',
      date: new Date(),
      seriesId: series.id,
      authorId: admin.id,
    },
  });
  console.log('Created sample sermon');

  // Create sample blog post
  const announcementsCat = await prisma.category.findUnique({ where: { slug: 'announcements' } });
  await prisma.post.upsert({
    where: { slug: 'welcome-to-our-church' },
    update: {},
    create: {
      title: 'Welcome to Our Church',
      slug: 'welcome-to-our-church',
      content: `
        <h2>We're Glad You're Here!</h2>
        <p>Welcome to our church website. We are a community of believers dedicated to worshiping God, growing in faith, and serving others.</p>
        <h3>Our Services</h3>
        <ul>
          <li>Sunday Worship: 10:00 AM</li>
          <li>Wednesday Bible Study: 7:00 PM</li>
          <li>Friday Youth Night: 6:00 PM</li>
        </ul>
        <p>We look forward to meeting you!</p>
      `,
      excerpt: 'Welcome to our church community! Learn about our services and how to get connected.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      authorId: admin.id,
      categoryId: announcementsCat?.id,
    },
  });
  console.log('Created sample blog post');

  // Create sample event
  const nextSunday = new Date();
  nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
  nextSunday.setHours(10, 0, 0, 0);

  await prisma.event.upsert({
    where: { slug: 'sunday-worship-service' },
    update: {},
    create: {
      title: 'Sunday Worship Service',
      slug: 'sunday-worship-service',
      description: 'Join us for our weekly worship service featuring praise, prayer, and preaching.',
      location: 'Main Sanctuary',
      startDate: nextSunday,
      endDate: new Date(nextSunday.getTime() + 2 * 60 * 60 * 1000),
      isRecurring: true,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=SU',
    },
  });
  console.log('Created sample event');

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
