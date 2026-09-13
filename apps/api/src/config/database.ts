import mongoose from 'mongoose';
import { env } from './env.js';
export async function connectDatabase() {
  await mongoose.connect(env.MONGODB_URI, { maxPoolSize: 20 });
}
export function databaseReady() {
  return mongoose.connection.readyState === 1;
}
