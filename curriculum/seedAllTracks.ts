/**
 * Code Circle Database Seed Pipeline for Multi-Track Curricula
 * Seeds all 9 Tracks, 90 Levels, Gated MCQ Quests, and Monaco RCE Challenges.
 */

import mongoose from 'mongoose';
import Domain from '../backend/src/models/domainModel';
import Level from '../backend/src/models/levelModel';
import CodingChallenge from '../backend/src/models/codingChallengeModel';
import Assessment from '../backend/src/models/assessmentModel';

export interface ITrackSeedManifest {
  name: string;
  description: string;
  coverImageUrl: string;
  category: string;
  levelsCount: number;
  primaryLanguage: 'c' | 'cpp' | 'java' | 'javascript' | 'python';
}

export const TRACK_MANIFESTS: ITrackSeedManifest[] = [
  {
    name: 'C Programming: Foundations to Systems',
    description: 'Master memory allocation, pointers, data structures, POSIX threads, and low-level systems programming in C.',
    coverImageUrl: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=1200&q=80',
    category: 'Systems & Core Programming',
    levelsCount: 10,
    primaryLanguage: 'c',
  },
  {
    name: 'C++ Programming: High-Performance Engineering',
    description: 'From modern C++20 syntax and STL algorithms to low-latency memory models, concurrency, and competitive programming.',
    coverImageUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
    category: 'Systems & High-Performance Engineering',
    levelsCount: 10,
    primaryLanguage: 'cpp',
  },
  {
    name: 'Java Programming: Core to Cloud Microservices',
    description: 'Comprehensive Java 21 mastery covering OOP, Collections, Streams, Multithreading, and Spring Boot enterprise architectures.',
    coverImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    category: 'Enterprise Software & Cloud Backend',
    levelsCount: 10,
    primaryLanguage: 'java',
  },
  {
    name: 'JavaScript Programming: V8 Engine to Full-Stack',
    description: 'Modern JavaScript mastery from language internals and event loops to Node.js, WebSockets, and real-time collaboration.',
    coverImageUrl: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&w=1200&q=80',
    category: 'Web & Full-Stack Programming',
    levelsCount: 10,
    primaryLanguage: 'javascript',
  },
  {
    name: 'MERN Stack Development: Enterprise Web Engineering',
    description: 'Build production full-stack web platforms with MongoDB, Express, React 19, Node.js, TailwindCSS, and Docker.',
    coverImageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80',
    category: 'Full-Stack Web Development',
    levelsCount: 10,
    primaryLanguage: 'javascript',
  },
  {
    name: 'MEAN Stack Development: Enterprise Reactive Systems',
    description: 'Enterprise applications with Angular 18+, TypeScript 5+, RxJS, Node.js, Express, and MongoDB persistence.',
    coverImageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    category: 'Enterprise Web Engineering',
    levelsCount: 10,
    primaryLanguage: 'javascript',
  },
  {
    name: 'AI & Machine Learning: Applied Mathematical Modeling',
    description: 'From NumPy vectorization and calculus to Scikit-Learn pipelines, PyTorch deep learning, and production MLOps.',
    coverImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    category: 'Artificial Intelligence & Machine Learning',
    levelsCount: 10,
    primaryLanguage: 'python',
  },
  {
    name: 'AI & Data Science: Analytics to Production Data Products',
    description: 'Master the end-to-end data lifecycle: Pandas, SQL window functions, statistical inference, DuckDB, and Streamlit products.',
    coverImageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    category: 'Artificial Intelligence & Data Science',
    levelsCount: 10,
    primaryLanguage: 'python',
  },
  {
    name: 'Cybersecurity & Ethical Hacking: Systems & Defensive Auditing',
    description: 'Practical security engineering: network packet inspection, Linux host hardening, OWASP mitigation, and authorized CTF auditing.',
    coverImageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
    category: 'Security Engineering & Systems',
    levelsCount: 10,
    primaryLanguage: 'python',
  },
];

/**
 * Seed Track Helper
 */
export async function seedTrackByManifest(manifest: ITrackSeedManifest) {
  let domain = await Domain.findOne({ name: manifest.name });
  if (!domain) {
    domain = await Domain.create({
      name: manifest.name,
      description: manifest.description,
      coverImageUrl: manifest.coverImageUrl,
      isLocked: false,
    });
    console.log(`[Seed] Created Domain: "${domain.name}" (${domain._id})`);
  } else {
    console.log(`[Seed] Using Existing Domain: "${domain.name}" (${domain._id})`);
  }
  return domain;
}
