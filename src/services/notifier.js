const { sendEmail, sendSMS } = require('../services/notificationService');

const safe = async (fn) => { try { await fn(); } catch (e) { console.error('Notification failed:', e.message || e); } };

const notifyPaymentSuccess = async ({ user, plan, amount }) => {
  if (!user) return;
  const emailSubject = 'Ndangira - Payment Successful';
  const emailHtml = `
    <h2>Payment Successful</h2>
    <p>Hello ${user.name || 'User'},</p>
    <p>Your payment of ${amount} RWF for <strong>${plan}</strong> was successful.</p>
    <p>You can now publish your property on Ndangira.</p>
  `;
  if (user.email) await safe(() => sendEmail({ to: user.email, subject: emailSubject, text: `Payment of ${amount} RWF for ${plan} successful.`, html: emailHtml }));
  if (user.phone) {
    await safe(() => sendSMS({ to: user.phone, message: `Ndangira: Payment of ${amount} RWF for ${plan} successful. You can now publish your property.` }));
  }
};

const notifyPropertyApproved = async ({ property, owner }) => {
  if (!owner) return;
  const emailSubject = 'Ndangira - Property Published';
  const emailHtml = `
    <h2>Your Property is Now Live</h2>
    <p>Hello ${owner.name || 'Owner'},</p>
    <p>Your property "<strong>${property?.title || 'Property'}</strong>" has been approved and published on Ndangira.</p>
    <p>Clients can now find it by searching your area: ${property?.area || ''}, ${property?.city || ''}.</p>
  `;
  if (owner.email) await safe(() => sendEmail({ to: owner.email, subject: emailSubject, text: `Your property ${property?.title || ''} is now published on Ndangira.`, html: emailHtml }));
  if (owner.phone) {
    await safe(() => sendSMS({ to: owner.phone, message: `Ndangira: Your property "${property?.title || ''}" is now published and visible to clients.` }));
  }
};

const notifyPropertyRejected = async ({ property, owner }) => {
  if (!owner) return;
  const emailSubject = 'Ndangira - Property Rejected';
  const emailHtml = `
    <h2>Property Not Approved</h2>
    <p>Hello ${owner.name || 'Owner'},</p>
    <p>Your property "<strong>${property?.title || 'Property'}</strong>" was not approved for publishing on Ndangira.</p>
    <p>Please contact the platform team for more details.</p>
  `;
  if (owner.email) await safe(() => sendEmail({ to: owner.email, subject: emailSubject, text: `Your property ${property?.title || ''} was not approved.`, html: emailHtml }));
  if (owner.phone) {
    await safe(() => sendSMS({ to: owner.phone, message: `Ndangira: Your property "${property?.title || ''}" was not approved for publishing.` }));
  }
};

const notifyUserVerified = async ({ user, isVerified }) => {
  if (!user) return;
  const emailSubject = isVerified ? 'Ndangira - Account Verified' : 'Ndangira - Account Verification Removed';
  const emailHtml = `
    <h2>Account Verification Update</h2>
    <p>Hello ${user.name || 'User'},</p>
    <p>Your Ndangira account has been ${isVerified ? 'verified' : 'unverified'} by the platform team.</p>
  `;
  if (user.email) await safe(() => sendEmail({ to: user.email, subject: emailSubject, text: `Your Ndangira account has been ${isVerified ? 'verified' : 'unverified'}.`, html: emailHtml }));
  if (user.phone) {
    await safe(() => sendSMS({ to: user.phone, message: `Ndangira: Your account has been ${isVerified ? 'verified' : 'unverified'} by the platform team.` }));
  }
};

module.exports = { notifyPaymentSuccess, notifyPropertyApproved, notifyPropertyRejected, notifyUserVerified };
