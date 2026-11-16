const asyncHandler = require('../utils/asyncHandler');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const User = require('../models/User');
const Property = require('../models/Property');
const Payment = require('../models/Payment');
const Category = require('../models/Category');
const Job = require('../models/Job');
const Ad = require('../models/Ad');
const Subscriber = require('../models/Subscriber');

const parseRange = (from, to, field = 'createdAt') => {
  const f = {};
  if (from) {
    const d = new Date(from);
    if (!isNaN(d)) f.$gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d)) { d.setHours(23, 59, 59, 999); f.$lte = d; }
  }
  return Object.keys(f).length ? { [field]: f } : {};
};

const inRange = (base, from, to, field = 'createdAt') => ({ ...base, ...parseRange(from, to, field) });

const getSummaryData = async (from, to) => {
  const [users, properties, payments, categories, jobs, ads, subscribers] = await Promise.all([
    User.find(parseRange(from, to)).select('-password').lean(),
    Property.find(parseRange(from, to)).populate('owner', 'name email').lean(),
    Payment.find(parseRange(from, to)).populate('user', 'name email').populate('property', 'title').lean(),
    Category.find(parseRange(from, to)).lean(),
    Job.find(parseRange(from, to)).populate('submittedBy', 'name email').lean(),
    Ad.find(parseRange(from, to)).lean(),
    Subscriber.find(parseRange(from, to)).lean(),
  ]);

  const completedPayments = payments.filter(p => p.status === 'completed');
  const totalRevenue = completedPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const byType = {};
  const byCategory = {};
  properties.forEach(p => {
    byType[p.type || 'unknown'] = (byType[p.type || 'unknown'] || 0) + 1;
    const c = p.category || 'unknown';
    byCategory[c] = (byCategory[c] || 0) + 1;
  });

  return {
    range: { from: from || null, to: to || null },
    generatedAt: new Date().toISOString(),
    counts: {
      users: users.length,
      verifiedUsers: users.filter(u => u.isVerified).length,
      owners: users.filter(u => u.role === 'owner').length,
      clients: users.filter(u => u.role === 'client').length,
      admins: users.filter(u => u.role === 'admin').length,
      properties: properties.length,
      publishedProperties: properties.filter(p => p.isPublished).length,
      pendingProperties: properties.filter(p => !p.isPublished).length,
      activeProperties: properties.filter(p => p.isActive).length,
      categories: categories.length,
      publishedCategories: categories.filter(c => c.isPublished).length,
      payments: payments.length,
      completedPayments: completedPayments.length,
      pendingPayments: payments.filter(p => p.status === 'pending').length,
      failedPayments: payments.filter(p => p.status === 'failed').length,
      totalRevenue,
      jobs: jobs.length,
      approvedJobs: jobs.filter(j => j.status === 'approved').length,
      publishedJobs: jobs.filter(j => j.isPublished).length,
      paidJobs: jobs.filter(j => j.paymentStatus === 'paid').length,
      ads: ads.length,
      approvedAds: ads.filter(a => a.status === 'approved').length,
      activeAds: ads.filter(a => a.isActive).length,
      paidAds: ads.filter(a => a.paymentStatus === 'paid').length,
      subscribers: subscribers.length,
      activeSubscribers: subscribers.filter(s => s.isActive).length,
    },
    breakdown: { byType, byCategory },
    users, properties, payments, categories, jobs, ads, subscribers,
  };
};

const getReportSummary = asyncHandler(async (req, res) => {
  const { from, to, type = 'summary' } = req.query;
  const data = await getSummaryData(from, to);
  const base = { type, range: data.range, generatedAt: data.generatedAt };
  const c = data.counts;
  const summaryCounts = {
    users: c.users,
    verifiedUsers: c.verifiedUsers,
    properties: c.properties,
    publishedProperties: c.publishedProperties,
    pendingProperties: c.pendingProperties,
    completedPayments: c.completedPayments,
    pendingPayments: c.pendingPayments,
    jobs: c.jobs,
    approvedJobs: c.approvedJobs,
    publishedJobs: c.publishedJobs,
    paidJobs: c.paidJobs,
    ads: c.ads,
    approvedAds: c.approvedAds,
    activeAds: c.activeAds,
    paidAds: c.paidAds,
    subscribers: c.subscribers,
    activeSubscribers: c.activeSubscribers,
  };

  if (type === 'users') {
    return res.status(200).json({
      success: true,
      data: {
        ...base,
        count: data.users.length,
        users: data.users.map(u => ({ _id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role, isVerified: u.isVerified, createdAt: u.createdAt })),
      },
    });
  }
  if (type === 'properties') {
    return res.status(200).json({
      success: true,
      data: {
        ...base,
        count: data.properties.length,
        properties: data.properties.map(p => ({ _id: p._id, title: p.title, type: p.type, category: p.category, price: p.price, currency: p.currency, area: p.area, isPublished: p.isPublished, paymentStatus: p.paymentStatus, owner: p.owner ? { name: p.owner.name, email: p.owner.email } : null, createdAt: p.createdAt })),
      },
    });
  }
  if (type === 'payments') {
    return res.status(200).json({
      success: true,
      data: {
        ...base,
        count: data.payments.length,
        payments: data.payments.map(p => ({ _id: p._id, type: p.type, amount: p.amount, currency: p.currency, method: p.method, status: p.status, transactionId: p.transactionId, user: p.user ? { name: p.user.name, email: p.user.email } : null, property: p.property ? { title: p.property.title } : null, createdAt: p.createdAt })),
      },
    });
  }
  if (type === 'categories') {
    return res.status(200).json({
      success: true,
      data: {
        ...base,
        count: data.categories.length,
        categories: data.categories.map(cat => ({ _id: cat._id, name: cat.name, slug: cat.slug, isPublished: cat.isPublished, createdAt: cat.createdAt })),
      },
    });
  }
  if (type === 'jobs') {
    return res.status(200).json({
      success: true,
      data: {
        ...base,
        count: data.jobs.length,
        jobs: data.jobs.map(j => ({ _id: j._id, title: j.title, company: j.company, location: j.location, type: j.type, category: j.category, amount: j.amount, currency: j.currency, paymentStatus: j.paymentStatus, status: j.status, isPublished: j.isPublished, submittedBy: j.submittedBy ? { name: j.submittedBy.name, email: j.submittedBy.email } : null, createdAt: j.createdAt })),
      },
    });
  }
  if (type === 'ads' || type === 'advertisements') {
    return res.status(200).json({
      success: true,
      data: {
        ...base,
        type: 'ads',
        count: data.ads.length,
        ads: data.ads.map(a => ({ _id: a._id, companyName: a.companyName, contactEmail: a.contactEmail, contactPhone: a.contactPhone, title: a.title, plan: a.plan, amount: a.amount, currency: a.currency, paymentStatus: a.paymentStatus, status: a.status, isActive: a.isActive, startsAt: a.startsAt, expiresAt: a.expiresAt, createdAt: a.createdAt })),
      },
    });
  }
  if (type === 'subscribers') {
    return res.status(200).json({
      success: true,
      data: {
        ...base,
        count: data.subscribers.length,
        subscribers: data.subscribers.map(s => ({ _id: s._id, email: s.email, isActive: s.isActive, createdAt: s.createdAt })),
      },
    });
  }
  if (type === 'all') {
    return res.status(200).json({
      success: true,
      data: {
        ...base,
        counts: summaryCounts,
        users: data.users.map(u => ({ _id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role, isVerified: u.isVerified, createdAt: u.createdAt })),
        properties: data.properties.map(p => ({ _id: p._id, title: p.title, type: p.type, category: p.category, price: p.price, currency: p.currency, area: p.area, isPublished: p.isPublished, paymentStatus: p.paymentStatus, owner: p.owner ? { name: p.owner.name, email: p.owner.email } : null, createdAt: p.createdAt })),
        payments: data.payments.map(p => ({ _id: p._id, type: p.type, amount: p.amount, currency: p.currency, method: p.method, status: p.status, transactionId: p.transactionId, user: p.user ? { name: p.user.name, email: p.user.email } : null, property: p.property ? { title: p.property.title } : null, createdAt: p.createdAt })),
        categories: data.categories.map(cat => ({ _id: cat._id, name: cat.name, slug: cat.slug, isPublished: cat.isPublished, createdAt: cat.createdAt })),
        jobs: data.jobs.map(j => ({ _id: j._id, title: j.title, company: j.company, location: j.location, type: j.type, category: j.category, amount: j.amount, currency: j.currency, paymentStatus: j.paymentStatus, status: j.status, isPublished: j.isPublished, submittedBy: j.submittedBy ? { name: j.submittedBy.name, email: j.submittedBy.email } : null, createdAt: j.createdAt })),
        ads: data.ads.map(a => ({ _id: a._id, companyName: a.companyName, contactEmail: a.contactEmail, contactPhone: a.contactPhone, title: a.title, plan: a.plan, amount: a.amount, currency: a.currency, paymentStatus: a.paymentStatus, status: a.status, isActive: a.isActive, startsAt: a.startsAt, expiresAt: a.expiresAt, createdAt: a.createdAt })),
        subscribers: data.subscribers.map(s => ({ _id: s._id, email: s.email, isActive: s.isActive, createdAt: s.createdAt })),
      },
    });
  }

  res.status(200).json({ success: true, data: { ...base, counts: summaryCounts } });
});

const fmtDate = (d) => d ? new Date(d).toISOString().replace('T', ' ').slice(0, 19) : '';

const sendExcel = async (res, filename, sheets) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Ndangira';
  wb.created = new Date();
  for (const s of sheets) {
    const ws = wb.addWorksheet((s.name || 'Sheet').slice(0, 31));
    ws.columns = s.columns;
    ws.addRows(s.rows);
    ws.getRow(1).font = { bold: true };
  }
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
  res.end();
};

const sendPdf = (res, filename, reportType, meta, sections) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - doc.page.margins.left - doc.page.margins.right;
  const brand = '#16a34a';
  const dark = '#111827';
  const muted = '#6b7280';
  const light = '#f3f4f6';
  const border = '#e5e7eb';
  const typeNames = { summary: 'Summary Report', users: 'Users Report', properties: 'Properties Report', payments: 'Payments Report', categories: 'Categories Report', jobs: 'Jobs Report', ads: 'Advertisements Report', subscribers: 'Subscribers Report', all: 'Full Platform Report' };
  const reportTitle = typeNames[reportType] || `${String(reportType || 'Report').replace(/^\w/, c => c.toUpperCase())} Report`;
  const generated = fmtDate(new Date());
  const rangeText = `Period: ${meta.from ? fmtDate(meta.from) : 'All time'}  to  ${meta.to ? fmtDate(meta.to) : 'Now'}`;

  let lastContentPage = 0;
  const markContent = () => { lastContentPage = Math.max(lastContentPage, doc.bufferedPageRange().count - 1); };

  const drawHeader = (first = false) => {
    const left = doc.page.margins.left;
    doc.save();
    doc.rect(0, 0, pageWidth, first ? 110 : 55).fill(brand);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(first ? 22 : 14).text('Ndangira', left, first ? 28 : 18, { continued: false });
    doc.font('Helvetica').fontSize(first ? 11 : 9).fillColor('#dcfce7').text('Property & Marketplace Platform', left, first ? 54 : 36);
    if (first) {
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#ffffff').text(reportTitle, left, 74, { width: contentWidth, align: 'right' });
    } else {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff').text(reportTitle, left, 22, { width: contentWidth, align: 'right' });
    }
    doc.restore();
    doc.x = doc.page.margins.left;
    doc.y = first ? 125 : 70;
  };

  const bottomLimit = () => doc.page.height - doc.page.margins.bottom - 35;
  const isFreshPage = () => doc.y <= 80;
  const ensureSpace = (h = 60) => {
    if (doc.y + h > bottomLimit() && !isFreshPage()) {
      doc.addPage();
      drawHeader(false);
    }
  };

  drawHeader(true);
  doc.fillColor(muted).font('Helvetica').fontSize(9).text(`Generated: ${generated}`, { align: 'right' });
  doc.text(rangeText, { align: 'right' });
  doc.moveDown(0.8);
  markContent();

  if (!sections || !sections.length) {
    doc.fillColor(dark).fontSize(11).text('No report data available for the selected criteria.', { align: 'center' });
    markContent();
  }

  for (const sec of (sections || [])) {
    ensureSpace(50);
    const y = doc.y;
    doc.save();
    doc.rect(doc.page.margins.left, y, contentWidth, 22).fill(light);
    doc.rect(doc.page.margins.left, y, 4, 22).fill(brand);
    doc.fillColor(dark).font('Helvetica-Bold').fontSize(12).text(sec.title, doc.page.margins.left + 12, y + 5, { width: contentWidth - 20 });
    doc.restore();
    doc.x = doc.page.margins.left;
    doc.y = y + 28;
    markContent();

    if (sec.kv) {
      const rows = sec.kv || [];
      if (!rows.length) {
        doc.fillColor(muted).font('Helvetica').fontSize(10).text('No data.', doc.page.margins.left + 4);
        markContent();
        doc.moveDown(0.6);
      } else {
        const col1 = contentWidth * 0.62;
        rows.forEach(([k, v], i) => {
          ensureSpace(22);
          const ry = doc.y;
          if (i % 2 === 0) doc.save().rect(doc.page.margins.left, ry - 2, contentWidth, 18).fill('#fafafa').restore();
          doc.fillColor(dark).font('Helvetica').fontSize(10).text(String(k ?? ''), doc.page.margins.left + 6, ry, { width: col1 - 10, lineBreak: false });
          doc.font('Helvetica-Bold').text(String(v ?? ''), doc.page.margins.left + col1, ry, { width: contentWidth - col1 - 6, align: 'right', lineBreak: false });
          doc.x = doc.page.margins.left;
          doc.y = ry + 16;
          doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.margins.left + contentWidth, doc.y).strokeColor(border).lineWidth(0.5).stroke();
          doc.y += 2;
          markContent();
        });
        if (doc.y + 10 < bottomLimit()) doc.moveDown(0.4);
      }
    }

    if (sec.rows) {
      const cols = sec.columns || [];
      const dataRows = sec.rows || [];
      if (!dataRows.length) {
        doc.fillColor(muted).font('Helvetica').fontSize(10).text('No records in range.', doc.page.margins.left + 4, doc.y, { lineBreak: false });
        doc.x = doc.page.margins.left;
        doc.y += 14;
        markContent();
        if (doc.y + 10 < bottomLimit()) doc.moveDown(0.4);
      } else {
        const widths = cols.map(() => contentWidth / Math.max(cols.length, 1));
        const drawTableHeader = () => {
          ensureSpace(24);
          const hy = doc.y;
          doc.save().rect(doc.page.margins.left, hy, contentWidth, 18).fill('#e8f5ec').restore();
          let x = doc.page.margins.left;
          cols.forEach((col, i) => {
            doc.fillColor(dark).font('Helvetica-Bold').fontSize(9).text(String(col), x + 4, hy + 4, { width: widths[i] - 8, ellipsis: true, lineBreak: false });
            x += widths[i];
          });
          doc.x = doc.page.margins.left;
          doc.y = hy + 20;
          markContent();
        };
        drawTableHeader();
        dataRows.forEach((row) => {
          const texts = cols.map((_, i) => String(row[i] ?? ''));
          const h = Math.max(16, ...texts.map((t, i) => doc.heightOfString(t, { width: widths[i] - 8, fontSize: 9 }) + 6));
          if (doc.y + h > bottomLimit() && !isFreshPage()) {
            doc.addPage();
            drawHeader(false);
            drawTableHeader();
          }
          const ry = doc.y;
          const ri = 0;
          if ((dataRows.indexOf(row)) % 2 === 1) doc.save().rect(doc.page.margins.left, ry, contentWidth, h).fill('#fcfcfc').restore();
          let x = doc.page.margins.left;
          texts.forEach((t, i) => {
            doc.fillColor('#374151').font('Helvetica').fontSize(9).text(t, x + 4, ry + 3, { width: widths[i] - 8 });
            x += widths[i];
          });
          doc.x = doc.page.margins.left;
          doc.y = ry + h;
          doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.margins.left + contentWidth, doc.y).strokeColor(border).lineWidth(0.25).stroke();
          markContent();
        });
        if (doc.y + 10 < bottomLimit()) doc.moveDown(0.5);
      }
    }
  }

  const range = doc.bufferedPageRange();
  const totalPages = Math.min(range.count, lastContentPage + 1);
  for (let i = range.start; i < range.start + totalPages; i++) {
    doc.switchToPage(i);
    const fy = doc.page.height - 30;
    doc.save();
    doc.moveTo(doc.page.margins.left, fy - 6).lineTo(pageWidth - doc.page.margins.right, fy - 6).strokeColor(border).lineWidth(0.5).stroke();
    doc.fillColor(muted).font('Helvetica').fontSize(8).text('Ndangira Platform Report', doc.page.margins.left, fy, { lineBreak: false });
    doc.text(`${reportTitle}  Ã¢â‚¬Â¢  ${generated}`, doc.page.margins.left, fy, { width: contentWidth, align: 'center', lineBreak: false });
    doc.text(`Page ${i - range.start + 1} of ${totalPages}`, doc.page.margins.left, fy, { width: contentWidth, align: 'right', lineBreak: false });
    doc.restore();
  }
  doc.flushPages();
  doc.end();
};

const exportReport = asyncHandler(async (req, res) => {
  const { from, to, format = 'pdf', type = 'summary' } = req.query;
  const data = await getSummaryData(from, to);
  const stamp = new Date().toISOString().slice(0, 10);
  const rangeLabel = `${from || 'all'}_${to || 'all'}`.replace(/[:]/g, '-');

  if (format === 'excel' || format === 'xlsx') {
    const reportTypeNorm = type === 'advertisements' ? 'ads' : type;
    const sheets = [];
    if (reportTypeNorm === 'summary' || reportTypeNorm === 'all') {
      const c = data.counts;
      sheets.push({
        name: 'Summary',
        columns: [{ header: 'Metric', key: 'metric', width: 28 }, { header: 'Value', key: 'value', width: 18 }],
        rows: [
          ['From', data.range.from || 'all'], ['To', data.range.to || 'all'], ['Generated At', data.generatedAt],
          ['Total Users', c.users],
          ['Verified Users', c.verifiedUsers],
          ['Total Properties', c.properties],
          ['Published Properties', c.publishedProperties],
          ['Pending Approval', c.pendingProperties],
          ['Completed Payments', c.completedPayments],
          ['Pending Payments', c.pendingPayments],
          ['Jobs', c.jobs],
          ['Approved Jobs', c.approvedJobs],
          ['Paid Jobs', c.paidJobs],
          ['Advertisements', c.ads],
          ['Approved Ads', c.approvedAds],
          ['Active Ads', c.activeAds],
          ['Subscribers', c.subscribers],
          ['Active Subscribers', c.activeSubscribers],
        ].map(([metric, value]) => ({ metric, value })),
      });
      if (reportTypeNorm === 'all') {
        sheets.push({ name: 'By Type', columns: [{ header: 'Type', key: 'k', width: 20 }, { header: 'Count', key: 'v', width: 12 }], rows: Object.entries(data.breakdown.byType).map(([k, v]) => ({ k, v })) });
        sheets.push({ name: 'By Category', columns: [{ header: 'Category', key: 'k', width: 20 }, { header: 'Count', key: 'v', width: 12 }], rows: Object.entries(data.breakdown.byCategory).map(([k, v]) => ({ k, v })) });
      }
    }
    if (reportTypeNorm === 'users' || reportTypeNorm === 'all') {
      sheets.push({
        name: 'Users',
        columns: [
          { header: 'Name', key: 'name', width: 22 }, { header: 'Email', key: 'email', width: 28 }, { header: 'Phone', key: 'phone', width: 16 },
          { header: 'Role', key: 'role', width: 10 }, { header: 'Verified', key: 'verified', width: 10 }, { header: 'Created', key: 'created', width: 20 },
        ],
        rows: data.users.map(u => ({ name: u.name, email: u.email, phone: u.phone || '', role: u.role, verified: u.isVerified ? 'Yes' : 'No', created: fmtDate(u.createdAt) })),
      });
    }
    if (reportTypeNorm === 'properties' || reportTypeNorm === 'all') {
      sheets.push({
        name: 'Properties',
        columns: [
          { header: 'Title', key: 'title', width: 28 }, { header: 'Owner', key: 'owner', width: 20 }, { header: 'Type', key: 'type', width: 12 },
          { header: 'Category', key: 'category', width: 12 }, { header: 'Price', key: 'price', width: 14 }, { header: 'Area', key: 'area', width: 16 },
          { header: 'Published', key: 'published', width: 10 }, { header: 'Payment', key: 'payment', width: 12 }, { header: 'Created', key: 'created', width: 20 },
        ],
        rows: data.properties.map(p => ({ title: p.title, owner: p.owner?.name || '', type: p.type, category: p.category, price: p.price ?? '', area: p.area || '', published: p.isPublished ? 'Yes' : 'No', payment: p.paymentStatus || '', created: fmtDate(p.createdAt) })),
      });
    }
    if (reportTypeNorm === 'payments' || reportTypeNorm === 'all') {
      sheets.push({
        name: 'Payments',
        columns: [
          { header: 'User', key: 'user', width: 22 }, { header: 'Property', key: 'property', width: 24 }, { header: 'Type', key: 'type', width: 14 },
          { header: 'Amount', key: 'amount', width: 12 }, { header: 'Currency', key: 'currency', width: 10 }, { header: 'Method', key: 'method', width: 10 },
          { header: 'Status', key: 'status', width: 12 }, { header: 'Transaction', key: 'tx', width: 18 }, { header: 'Created', key: 'created', width: 20 },
        ],
        rows: data.payments.map(p => ({ user: p.user?.name || p.user?.email || '', property: p.property?.title || '', type: p.type, amount: p.amount, currency: p.currency, method: p.method, status: p.status, tx: p.transactionId || '', created: fmtDate(p.createdAt) })),
      });
    }
    if (reportTypeNorm === 'categories' || reportTypeNorm === 'all') {
      sheets.push({
        name: 'Categories',
        columns: [{ header: 'Name', key: 'name', width: 24 }, { header: 'Slug', key: 'slug', width: 24 }, { header: 'Published', key: 'published', width: 12 }, { header: 'Created', key: 'created', width: 20 }],
        rows: data.categories.map(c => ({ name: c.name, slug: c.slug, published: c.isPublished ? 'Yes' : 'No', created: fmtDate(c.createdAt) })),
      });
    }
    if (reportTypeNorm === 'jobs' || reportTypeNorm === 'all') {
      sheets.push({
        name: 'Jobs',
        columns: [
          { header: 'Title', key: 'title', width: 28 }, { header: 'Company', key: 'company', width: 22 }, { header: 'Location', key: 'location', width: 18 },
          { header: 'Type', key: 'type', width: 14 }, { header: 'Category', key: 'category', width: 14 }, { header: 'Amount', key: 'amount', width: 12 },
          { header: 'Payment', key: 'payment', width: 12 }, { header: 'Status', key: 'status', width: 12 }, { header: 'Published', key: 'published', width: 12 },
          { header: 'Submitted By', key: 'submittedBy', width: 22 }, { header: 'Created', key: 'created', width: 20 },
        ],
        rows: data.jobs.map(j => ({ title: j.title, company: j.company, location: j.location, type: j.type, category: j.category || '', amount: j.amount ?? '', payment: j.paymentStatus || '', status: j.status, published: j.isPublished ? 'Yes' : 'No', submittedBy: j.submittedBy?.email || j.submittedBy?.name || '', created: fmtDate(j.createdAt) })),
      });
    }
    if (reportTypeNorm === 'ads' || reportTypeNorm === 'all') {
      sheets.push({
        name: 'Advertisements',
        columns: [
          { header: 'Company', key: 'company', width: 24 }, { header: 'Title', key: 'title', width: 26 }, { header: 'Plan', key: 'plan', width: 12 },
          { header: 'Amount', key: 'amount', width: 12 }, { header: 'Payment', key: 'payment', width: 12 }, { header: 'Status', key: 'status', width: 12 },
          { header: 'Active', key: 'active', width: 10 }, { header: 'Contact Email', key: 'email', width: 24 }, { header: 'Expires', key: 'expires', width: 20 }, { header: 'Created', key: 'created', width: 20 },
        ],
        rows: data.ads.map(a => ({ company: a.companyName, title: a.title, plan: a.plan, amount: a.amount, payment: a.paymentStatus, status: a.status, active: a.isActive ? 'Yes' : 'No', email: a.contactEmail || '', expires: fmtDate(a.expiresAt), created: fmtDate(a.createdAt) })),
      });
    }
    if (reportTypeNorm === 'subscribers' || reportTypeNorm === 'all') {
      sheets.push({
        name: 'Subscribers',
        columns: [
          { header: 'Email', key: 'email', width: 32 }, { header: 'Active', key: 'active', width: 12 }, { header: 'Subscribed', key: 'created', width: 20 },
        ],
        rows: data.subscribers.map(s => ({ email: s.email, active: s.isActive ? 'Yes' : 'No', created: fmtDate(s.createdAt) })),
      });
    }
    return sendExcel(res, `ndangira-report-${reportTypeNorm}-${stamp}.xlsx`, sheets);
  }

  // PDF
  const c = data.counts;
  const sections = [];
  const reportTypeNorm = type === 'advertisements' ? 'ads' : type;
  if (reportTypeNorm === 'summary' || reportTypeNorm === 'all') {
    sections.push({
      title: 'Platform Summary',
      kv: [
        ['Total Users', c.users],
        ['Verified Users', c.verifiedUsers],
        ['Total Properties', c.properties],
        ['Published Properties', c.publishedProperties],
        ['Pending Approval', c.pendingProperties],
        ['Completed Payments', c.completedPayments],
        ['Pending Payments', c.pendingPayments],
        ['Jobs', c.jobs],
        ['Approved Jobs', c.approvedJobs],
        ['Paid Jobs', c.paidJobs],
        ['Advertisements', c.ads],
        ['Approved Ads', c.approvedAds],
        ['Active Ads', c.activeAds],
        ['Subscribers', c.subscribers || 0],
        ['Active Subscribers', c.activeSubscribers || 0],
      ],
    });
  }
  if (reportTypeNorm === 'users' || reportTypeNorm === 'all') {
    sections.push({ title: 'Users', columns: ['Name', 'Email', 'Role', 'Verified', 'Created'], rows: data.users.map(u => [u.name, u.email, u.role, u.isVerified ? 'Yes' : 'No', fmtDate(u.createdAt)]) });
  }
  if (reportTypeNorm === 'properties' || reportTypeNorm === 'all') {
    sections.push({ title: 'Properties', columns: ['Title', 'Owner', 'Type', 'Category', 'Published', 'Created'], rows: data.properties.map(p => [p.title, p.owner?.name || '', p.type, p.category, p.isPublished ? 'Yes' : 'No', fmtDate(p.createdAt)]) });
  }
  if (reportTypeNorm === 'payments' || reportTypeNorm === 'all') {
    sections.push({ title: 'Payments', columns: ['User', 'Amount', 'Status', 'Method', 'Created'], rows: data.payments.map(p => [p.user?.name || p.user?.email || '', `${p.amount} ${p.currency}`, p.status, p.method, fmtDate(p.createdAt)]) });
  }
  if (reportTypeNorm === 'categories' || reportTypeNorm === 'all') {
    sections.push({ title: 'Categories', columns: ['Name', 'Slug', 'Published', 'Created'], rows: data.categories.map(ca => [ca.name, ca.slug, ca.isPublished ? 'Yes' : 'No', fmtDate(ca.createdAt)]) });
  }
  if (reportTypeNorm === 'jobs' || reportTypeNorm === 'all') {
    sections.push({ title: 'Jobs', columns: ['Title', 'Company', 'Location', 'Payment', 'Status', 'Created'], rows: data.jobs.map(j => [j.title, j.company, j.location, `${j.paymentStatus || 'unpaid'} (${j.amount || 0} ${j.currency || 'RWF'})`, `${j.status}${j.isPublished ? '/published' : ''}`, fmtDate(j.createdAt)]) });
  }
  if (reportTypeNorm === 'ads' || reportTypeNorm === 'all') {
    sections.push({ title: 'Advertisements', columns: ['Company', 'Title', 'Plan', 'Payment', 'Status', 'Expires'], rows: data.ads.map(a => [a.companyName, a.title, a.plan, `${a.paymentStatus} (${a.amount} ${a.currency || 'RWF'})`, `${a.status}${a.isActive ? '/active' : ''}`, fmtDate(a.expiresAt)]) });
  }
  if (reportTypeNorm === 'subscribers' || reportTypeNorm === 'all') {
    sections.push({ title: 'Subscribers', columns: ['Email', 'Active', 'Subscribed'], rows: data.subscribers.map(s => [s.email, s.isActive ? 'Yes' : 'No', fmtDate(s.createdAt)]) });
  }
  sendPdf(res, `ndangira-report-${reportTypeNorm}-${stamp}.pdf`, reportTypeNorm, { from, to }, sections);
});

module.exports = { getReportSummary, exportReport };
