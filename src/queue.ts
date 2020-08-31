import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// import { onStart, onSignal } from './app';

const connection = new IORedis(6379, 'memory_db');

export default new Queue('PaymentGateway', { connection });

/*
onStart.push(
  (async () => {
    await queue.resume();
  })()
);
onSignal.push(
  (async () => {
    await queue.pause();
  })()
);
*/
