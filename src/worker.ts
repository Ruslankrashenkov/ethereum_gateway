import os from 'os';

import { Job, Worker } from 'bullmq';
import IORedis from 'ioredis';

import { jobs } from './jobs';
import { inspect } from './utils';

const connection = new IORedis(6379, 'memory_db');

export default new Worker(
  'PaymentGateway',
  async (job: Job) => {
    await jobs[job.name](job);
  },
  { connection }
).on('failed', (job: Job, error) => {
  console.error(
    `Job ${inspect(job.id)} failed with:${os.EOL}${inspect(error)}`
  );
});
