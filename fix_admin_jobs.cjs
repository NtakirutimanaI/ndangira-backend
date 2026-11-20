const fs = require('fs');
let content = fs.readFileSync('api/src/controllers/adminController.js', 'utf8');

const oldJobs = `// Create jobs
  const jobs = [
    {
      title: 'Software Developer',
      company: 'Tech Rwanda Ltd',
      location: 'Kigali',
      type: 'Full-time',
      category: 'IT',
      description: 'Looking for experienced React/Node developer',
      applyEmail: 'jobs@techrw.com',
      applyUrl: 'https://techrw.com/careers',
      amount: 5000,
      currency: 'RWF',
      paymentStatus: 'paid',
      status: 'approved',
      isPublished: true,
      submittedBy: admin._id
    },
    {
      title: 'Marketing Manager',
      company: 'Rwanda Marketing Group',
      location: 'Kigali',
      type: 'Full-time',
      category: 'Marketing',
      description: 'Lead marketing campaigns for growing startup',
      applyEmail: 'hr@rmg.rw',
      amount: 5000,
      currency: 'RWF',
      paymentStatus: 'paid',
      status: 'approved',
      isPublished: true,
      submittedBy: admin._id
    }
  ];

  await Job.insertMany(jobs);`;

const newJobs = `// Create jobs
  const jobs = [
    {
      title: 'Software Developer',
      company: 'Tech Rwanda Ltd',
      location: 'Kigali',
      type: 'Full-time',
      category: 'IT',
      description: 'Looking for experienced React/Node developer',
      applyEmail: 'jobs@techrw.com',
      applyUrl: 'https://techrw.com/careers',
      employerAmount: 5000,
      platformAmount: 5500,
      currency: 'RWF',
      platformFeePercent: 10,
      paymentStatus: 'paid',
      status: 'approved',
      isPublished: true,
      submittedBy: admin._id
    },
    {
      title: 'Marketing Manager',
      company: 'Rwanda Marketing Group',
      location: 'Kigali',
      type: 'Full-time',
      category: 'Marketing',
      description: 'Lead marketing campaigns for growing startup',
      applyEmail: 'hr@rmg.rw',
      employerAmount: 5000,
      platformAmount: 5500,
      currency: 'RWF',
      platformFeePercent: 10,
      paymentStatus: 'paid',
      status: 'approved',
      isPublished: true,
      submittedBy: admin._id
    }
  ];

  await Job.insertMany(jobs);`;

content = content.replace(oldJobs, newJobs);
fs.writeFileSync('api/src/controllers/adminController.js', content);
console.log('Done');