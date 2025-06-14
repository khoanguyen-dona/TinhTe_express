// const jwt = require('jsonwebtoken')
// const Post = require('../models/Post')
// const Chat = require('../models/Chat')


// const verifyToken = (req, res, next) => {
//     const bearerToken = req.headers.token
//     if (bearerToken) { 
    
//         const TOKEN = bearerToken.split(" ")[1]
//         console.log('TOKEN', TOKEN)
//         jwt.verify(TOKEN, process.env.JWT_SECRET_KEY, (err, user) => {
//             if (err) return res.status(403).json({message: 'Token is not valid'});
//             req.user = user;        
//             next();
//         });
//     } else {
//         return res.status(401).json("You are not authenticated!");
//     }
// };

// const isAuthenticated =(req, res, next) => {
//     verifyToken(req, res, () => {
//         if (req.user){
//             next();
//         } else {
//             console.log('not authenticated')
//             return res.status(403).json({message: 'Forbidden: you are not authenticated  '})
//         }
//     })
// }

// const isAdmin = (req, res, next) => {
//     verifyToken(req, res, () => {
//         if (req.user.isAdmin) {
//             next();
//         } else {
//            return res.status(403).json({message: 'Forbidden: you are not admin to do this'})
//         }
//     })
// }

// const isReporter = (req, res, next) => {
//     verifyToken(req, res, () => {
//         if (req.user.isReporter) {
//             next();
//         } else {
//            return res.status(403).json({message: 'Forbidden: you are not reporter to this'})
//         }
//     })
// }

// // const isRelatedToChatByChatId = (req, res, next) => {

// //     verifyToken(req, res, async () => {
// //         const userRequestId = req.user.id
// //         const chatId = req.params.chatId || req.query.chatId
        
// //         console.log('userRequestId:',userRequestId)
// //         const chat = await Chat.findById(chatId)
// //         if (chat && chat.members.includes(userRequestId) ) {
// //             next()
// //         } else{
// //             res.status(403).json({message:'Forbidden: you can not see chat that you are not related to'})
// //         }
// //     })
// // }

// const isRelatedToChatByUserId = (req, res, next) => {
//     verifyToken(req, res, async () => {
//         const userRequestId = req.user.id
//         const userId_1 = req.query.user1
//         const userId_2 = req.query.user2
//         if ( userRequestId===userId_1 || userRequestId===userId_2 ) {
//             next()
//         } else{
//             res.status(403).json({message:'Forbidden: you can not see chat that you are not related to'})
//         }
//     })
// }


// const isOwnerOfChatList = (req, res, next) => {
//     verifyToken(req, res, async () => {
//         const userRequestId = req.user.id
//         const userParamsId = req.params.userId
//         if ( userRequestId === userParamsId ) {
//             next()
//         } else{
//             res.status(403).json({message:'Forbidden: you can not see chat-list that you are not related to'})
//         }
//     })
// }



// const isPostAuthor = (req, res, next) => {
//     verifyToken(req, res , async () => {
//         const userRequestId = req.user.id.toString()
//         const postId = req.params.postId
//         const post = await Post.findById(postId)
   

//         if ( post.authorId.toString() === userRequestId  ) {
//             next()
//         } else {
//             res.status(403).json({message:'Forbidden: you are not the owner of the post '})
//         }
//     })
// }

// module.exports = {
//     isAuthenticated,
//     isReporter,
//     isAdmin,
//     // isRelatedToChatByChatId,
//     isRelatedToChatByUserId,
//     isOwnerOfChatList,
//     isPostAuthor
// }