const router = require('express').Router()
const  redis = require('../config/redis');

//get current onlineUsers 
router.get('/all-users', async(req, res)=>{
    try {
          // find onlineUsers in redis if it has return the result
          const onlineUsers = await redis.lRange('onlineUsers', 0, -1)
          if( onlineUsers.length > 0 ){          
            res.status(200).json({message:'get onlineUsers successfully from cached', onlineUsers: JSON.parse(onlineUsers)})
          
               
        //  if it not existed in redis 
          } else {

            const pipeline = redis.multi() 
            const onlineUserIds = await redis.sMembers('onlineUserIds')
            if( onlineUserIds.length > 0 ){
              for( const user of onlineUserIds ){
                const userId = user.split(':')[1]
                pipeline.hGetAll(`userId:${userId}`)
              }
              const onlineUsers = await pipeline.exec()
              // save onlineUsers  to redis
              await redis.lPush('onlineUsers', JSON.stringify(onlineUsers) )
              await redis.expire('onlineUsers', 10)
              res.status(200).json({message:'get onlineUsers successfully', onlineUsers: onlineUsers})
            }
         
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