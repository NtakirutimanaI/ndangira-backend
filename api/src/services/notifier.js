const { sendEmail, sendSMS } = require('./notificationService');
const Subscriber = require('../models/Subscriber');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const safe = async (fn) => { try { await fn(); } catch (e) { console.error('Notification failed:', e.message || e); } };

const getActiveSubscriberEmails = async () => {
  const subs = await Subscriber.find({ isActive: true }).select('email');
  return [...new Set(subs.map((s) => (s.email || '').trim().toLowerCase()).filter(Boolean))];
};

const sendToSubscribers = async ({ subject, text, html }) => {
  const emails = await getActiveSubscriberEmails();
  if (!emails.length) return { sent: 0 };
  await Promise.all(emails.map((to) => safe(() => sendEmail({ to, subject, text, html }))));
  return { sent: emails.length };
};

const notifySubscribersNewProperty = async ({ property }) => {
  if (!property) return;
  const title = property.title || 'New Property';
  const location = [property.area, property.city].filter(Boolean).join(', ');
  const price = property.price != null ? `${Number(property.price).toLocaleString()} ${property.currency || 'RWF'}` : '';
  const link = `${CLIENT_URL}/listings/${property._id}`;
  const subject = `Isange - New Property: ${title}`;
  const desc = property.description ? String(property.description).slice(0, 300) : '';
  const text = `New property published on Isange!\n\n${title}\n${location ? location + '\n' : ''}${price ? price + '\n' : ''}\n${desc}\n\nView: ${link}`;
  const html = `
    <h2>New Property on Isange</h2>
    <p><strong>${title}</strong></p>
    ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
    ${price ? `<p><strong>Price:</strong> ${price}</p>` : ''}
    ${desc ? `<p>${desc}</p>` : ''}
    <p><a href="${link}">View property</a></p>
  `;
  await safe(() => sendToSubscribers({ subject, text, html }));
};

const notifySubscribersNewJob = async ({ job }) => {
  if (!job) return;
  const title = job.title || 'New Job';
  const company = job.company || '';
  const location = job.location || '';
  const link = `${CLIENT_URL}/jobs`;
  const subject = `Isange - New Job: ${title}`;
  const desc = job.description ? String(job.description).slice(0, 300) : '';
  const text = `New job posted on Isange!\n\n${title}${company ? ' at ' + company : ''}\n${location ? location + '\n' : ''}${job.type ? job.type + '\n' : ''}\n${desc}\n\nView jobs: ${link}`;
  const html = `
    <h2>New Job on Isange</h2>
    <p><strong>${title}</strong>${company ? ` at ${company}` : ''}</p>
    ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
    ${job.type ? `<p><strong>Type:</strong> ${job.type}</p>` : ''}
    ${desc ? `<p>${desc}</p>` : ''}
    <p><a href="${link}">View jobs</a></p>
  `;
  await safe(() => sendToSubscribers({ subject, text, html }));
};

const notifySubscribersNewAd = async ({ ad }) => {
  if (!ad) return;
  const title = ad.title || 'New Advertisement';
  const company = ad.companyName || '';
  const link = `${CLIENT_URL}/advertise`;
  const subject = `Isange - New Advertisement: ${title}`;
  const desc = ad.description ? String(ad.description).slice(0, 300) : '';
  const target = ad.targetUrl ? `<p><a href="${ad.targetUrl}">Visit advertiser</a></p>` : '';
  const text = `New advertisement on Isange!\n\n${title}${company ? ' - ' + company : ''}\n\n${desc}\n\nView: ${link}`;
  const html = `
    <h2>New Advertisement on Isange</h2>
    <p><strong>${title}</strong>${company ? ` — ${company}` : ''}</p>
    ${desc ? `<p>${desc}</p>` : ''}
    ${target}
    <p><a href="${link}">View advertisements</a></p>
  `;
  await safe(() => sendToSubscribers({ subject, text, html }));
};

const notifyPaymentSuccess = async ({ user, plan, amount }) => {
  if (!user) return;
  const emailSubject = 'Isange - Payment Successful';
  const emailHtml = `
    <h2>Payment Successful</h2>
    <p>Hello ${user.name || 'User'},</p>
    <p>Your payment of ${amount} RWF for <strong>${plan}</strong> was successful.</p>
    <p>You can now publish your property on Isange.</p>
  `;
  if (user.email) await safe(() => sendEmail({ to: user.email, subject: emailSubject, text: `Payment of ${amount} RWF for ${plan} successful.`, html: emailHtml }));
  if (user.phone) {
    await safe(() => sendSMS({ to: user.phone, message: `Isange: Payment of ${amount} RWF for ${plan} successful. You can now publish your property.` }));
  }
};

const notifyPropertyApproved = async ({ property, owner }) => {
  if (!owner) return;
  const emailSubject = 'Isange - Property Published';
  const emailHtml = `
    <h2>Your Property is Now Live</h2>
    <p>Hello ${owner.name || 'Owner'},</p>
    <p>Your property "<strong>${property?.title || 'Property'}</strong>" has been approved and published on Isange.</p>
    <p>Clients can now find it by searching your area: ${property?.area || ''}, ${property?.city || ''}.</p>
  `;
  if (owner.email) await safe(() => sendEmail({ to: owner.email, subject: emailSubject, text: `Your property ${property?.title || ''} is now published on Isange.`, html: emailHtml }));
  if (owner.phone) {
    await safe(() => sendSMS({ to: owner.phone, message: `Isange: Your property "${property?.title || ''}" is now published and visible to clients.` }));
  }
};

const notifyPropertyRejected = async ({ property, owner }) => {
  if (!owner) return;
  const emailSubject = 'Isange - Property Rejected';
  const emailHtml = `
    <h2>Property Not Approved</h2>
    <p>Hello ${owner.name || 'Owner'},</p>
    <p>Your property "<strong>${property?.title || 'Property'}</strong>" was not approved for publishing on Isange.</p>
    <p>Please contact the platform team for more details.</p>
  `;
  if (owner.email) await safe(() => sendEmail({ to: owner.email, subject: emailSubject, text: `Your property ${property?.title || ''} was not approved.`, html: emailHtml }));
  if (owner.phone) {
    await safe(() => sendSMS({ to: owner.phone, message: `Isange: Your property "${property?.title || ''}" was not approved for publishing.` }));
  }
};

const notifyUserVerified = async ({ user, isVerified }) => {
  if (!user) return;
  const emailSubject = isVerified ? 'Isange - Account Verified' : 'Isange - Account Verification Removed';
  const emailHtml = `
    <h2>Account Verification Update</h2>
    <p>Hello ${user.name || 'User'},</p>
    <p>Your Isange account has been ${isVerified ? 'verified' : 'unverified'} by the platform team.</p>
  `;
  if (user.email) await safe(() => sendEmail({ to: user.email, subject: emailSubject, text: `Your Isange account has been ${isVerified ? 'verified' : 'unverified'}.`, html: emailHtml }));
  if (user.phone) {
    await safe(() => sendSMS({ to: user.phone, message: `Isange: Your account has been ${isVerified ? 'verified' : 'unverified'} by the platform team.` }));
  }
};

module.exports = { notifyPaymentSuccess, notifyPropertyApproved, notifyPropertyRejected, notifyUserVerified, notifySubscribersNewProperty, notifySubscribersNewJob, notifySubscribersNewAd };