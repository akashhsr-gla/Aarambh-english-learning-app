const mongoose = require('mongoose');
const Region = require('../models/Region');
require('dotenv').config({ path: './env.local' });

const regions = [
  {
    name: 'Delhi',
    code: 'DL',
    description: 'National Capital Region of India'
  },
  {
    name: 'Mumbai',
    code: 'MH',
    description: 'Financial capital of India'
  },
  {
    name: 'Bangalore',
    code: 'KA',
    description: 'Silicon Valley of India'
  },
  {
    name: 'Chennai',
    code: 'TN',
    description: 'Gateway to South India'
  },
  {
    name: 'Kolkata',
    code: 'WB',
    description: 'Cultural capital of India'
  },
  {
    name: 'Hyderabad',
    code: 'TG',
    description: 'City of Pearls'
  },
  {
    name: 'Pune',
    code: 'MH2',
    description: 'Oxford of the East'
  },
  {
    name: 'Ahmedabad',
    code: 'GJ',
    description: 'Manchester of India'
  }
];

const seedRegions = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing regions
    await Region.deleteMany({});
    console.log('Cleared existing regions');

    // Insert new regions
    const createdRegions = await Region.insertMany(regions);
    console.log(`Created ${createdRegions.length} regions:`);
    
    createdRegions.forEach(region => {
      console.log(`- ${region.name} (${region.code})`);
    });

    console.log('\nRegions seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding regions:', error);
    process.exit(1);
  }
};

seedRegions();
