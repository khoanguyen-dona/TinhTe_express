const router = require('express').Router()
const  redis = require('../config/redis');

//get current onlineUsers 
router.get('/all-users', async(req, res)=>{
    try {
        // find online users in redis if it already in redis
        const onlineUsers = await redis.lRange('onlineUsers', 0, -1)    
        if(onlineUsers.length> 0 ){
            res.status(200).json({message:'get online users successfully from cached!', onlineUsers: JSON.parse(onlineUsers)})

         // if it not existed in redis 
        } else {

            const users = []
            const onlineUsers = []
            const userKeys = await redis.keys('userId:*')
            for( const key of userKeys ){
                let data = await redis.hGetAll(key)
                users.push(data)
            }

            users.filter((user)=>user.status==='online'? onlineUsers.push({userId: user.userId, username: user.username , avatar: user.avatar}) : '' )
            
            // push to redis
            await redis.lPush('onlineUsers',JSON.stringify(onlineUsers))
            await redis.expire('onlineUsers',10)
            res.status(200).json({message:'get users successfully', onlineUsers: onlineUsers})
        }
    } catch(err){
        console.log('create message failed',err)
    }
})

// get groupChat message
router.get('/group-messages', async(req, res)=>{
  try {
    const messages = await redis.lRange('groupChat', 0, -1)
    res.status(200).json({message:'get group chat messages successfully', messages: messages})
  } catch(err){
    console.log('fetch group chat message failed', err)
  }
})




module.exports = router