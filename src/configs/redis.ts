import Redis from 'ioredis';
import config from './env.ts';

/**
 * Redis client configuration using ioredis.
 * Optimized for Upstash with TLS and a backoff retry strategy.
 */
const redis = new Redis(config.UPSTASH_REDIS_URL, {
  // Upstash requires TLS for connection
  tls: {},
  
  // Prevents the app from hanging if a request fails
  maxRetriesPerRequest: 3,

  // Custom Exponential Backoff Strategy
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    
    if (times > config.REDIS_MAX_RETRIES) {
      console.error(`⚠️ Redis: Max retries (${config.REDIS_MAX_RETRIES}) reached. Connection failed.`);
      return null; // Stop retrying and trigger 'error' event
    }
    
    return delay;
  },
});

// --- Event Listeners ---

redis.on('connect', () => {
  console.log('🚀 Redis: Connected successfully');
});

redis.on('error', (err: Error) => {
  console.error('❌ Redis: Connection error:', err.message);
});

/**
 * Handle unexpected closure. 
 * ioredis handles reconnection automatically via 'retryStrategy', 
 * so manual disconnect/connect in 'error' event is usually unnecessary.
 */
redis.on('close', () => {
  console.warn('📡 Redis: Connection closed');
});

export default redis;