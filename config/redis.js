

const { createClient } = require('redis'); // Redis client
// --- Redis Client Setup ---
const redis = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: 'redis-15187.c1.ap-southeast-1-1.ec2.redns.redis-cloud.com',
        port: 15187
    }
   
  });
  
  redis.on('connect', () => console.log('Connected to Redis!'));
  redis.on('error', err => console.error('Redis Client Error', err));
  
  
  async function connectRedis() {
    try {
      await redis.connect();
    } catch (err) {
      console.error('Failed to connect to Redis:', err);
      process.exit(1); // Exit if Redis connection fails on startup
    }
  }
  connectRedis(); // Connect to Redis when the server starts

// Export the client and the connect function
module.exports = redis;