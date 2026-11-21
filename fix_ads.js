const mongoose = require('mongoose');
require('dotenv').config();
const Ad = require('./src/models/Ad');

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  const ads = await Ad.find({ videos: { $exists: true, $ne: [] } });
  for (const ad of ads) {
    const fixed = ad.videos.map(v => {
      if (v.includes('\\') || v.includes('/uploads/')) {
        return v.split('\\').pop().split('/').pop();
      }
      return v;
    });
    if (JSON.stringify(fixed) !== JSON.stringify(ad.videos)) {
      ad.videos = fixed;
      await ad.save();
      console.log('Fixed ad:', ad._id, 'videos:', fixed);
    }
  }
  console.log('Done');
  process.exit(0);
}
fix().catch(e => { console.error(e); process.exit(1); });