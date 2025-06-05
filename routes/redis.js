const router = require('express').Router()



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


//get current onlineUsers 
router.get('/all-users', async(req, res)=>{
    try {
        // find online users in redis if it already in redis
        const onlineUsers = await redis.lRange('onlineUsers', 0, -1)    
        console.log('onlineUsers', onlineUsers)
        if(onlineUsers.length> 0 ){
            res.status(200).json({message:'get online users successfully from cached!', userIds: onlineUsers})

         // if it not existed in redis 
        } else {

            const users = []
            const userIds = []
            const userKeys = await redis.keys('userId:*')
            for( const key of userKeys ){
                let data = await redis.hGetAll(key)
                users.push(data)
            }
            users.filter((user)=>user.status==='online'? userIds.push(user.userId) : '' )
            
            // push to redis
            await redis.lPush('onlineUsers',userIds)
            await redis.expire('onlineUsers',20)
            res.status(200).json({message:'get users successfully', userIds: userIds})
        }
    } catch(err){
        console.log('create message failed',err)
    }
})




module.exports = router