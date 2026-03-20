const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const Bearer = require('../models/bearerModel');

const bearers = [
  {
    name: "Rahul Prakash",
    role: "President",
    specialization: "AI & System Architecture",
    iconType: "Shield",
    socialLinks: {
      github: "https://github.com/rahul-prakash-y",
      linkedin: "https://linkedin.com/in/rahulprakashy",
      email: "rahul@codecircle.edu"
    }
  },
  {
    name: "Sarah Chen",
    role: "Vice President",
    specialization: "Full Stack Development",
    iconType: "Terminal",
    socialLinks: {
      github: "#",
      linkedin: "#",
      email: "sarah@codecircle.edu"
    }
  },
  {
    name: "Alex Rivera",
    role: "Technical Lead",
    specialization: "Cloud Computing & DevOps",
    iconType: "Cpu",
    socialLinks: {
      github: "#",
      linkedin: "#",
      email: "alex@codecircle.edu"
    }
  },
  {
    name: "Mia Wong",
    role: "Design Lead",
    specialization: "UI/UX & Creative Direction",
    iconType: "Layout",
    socialLinks: {
      github: "#",
      linkedin: "#",
      email: "mia@codecircle.edu"
    }
  }
];

const seedBearers = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Clearing existing bearers...');
    await Bearer.deleteMany({});
    console.log('Seeding bearers...');
    await Bearer.insertMany(bearers);
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding bearers:', error);
    process.exit(1);
  }
};

seedBearers();
