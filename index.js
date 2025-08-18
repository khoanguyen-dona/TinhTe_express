const Chat = require('./models/Chat');
const User = require('./models/User')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const jwt = require("jsonwebtoken");
const password_generator = require('password-generator')
const express = require('express')
const passport = require("passport");
const session = require("express-session");
const cors = require('cors')
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const dotenv = require('dotenv')
dotenv.config()
const redis = require('./config/redis');
const mongoose = require('mongoose')
const postRoute = require('./routes/post')
const authRoute = require('./routes/auth')
const userRoute = require('./routes/user')
const commentRoute = require('./routes/comment')
const reportCommentRoute = require('./routes/reportComment')
const commentEmotionRoute = require('./routes/commentEmotion')
const postEmotionRoute = require('./routes/postEmotion')
const chatRoute = require('./routes/chat')
const messageRoute = require('./routes/message')
const redisRoute = require('./routes/redis');
const notificationRoute = require('./routes/notification');
const visitRoute = require('./routes/visit')

// multithread
// const cluster = require('cluster');
// const app = express()
// const os = require('os');

// if (cluster.isMaster) {
//   const cpuCount = os.cpus().length;
//   for (let i = 0; i < cpuCount; i++) {
//     cluster.fork();
//   }
// } else {
//   app.listen(process.env.PORT ,() => {
//     console.log('backend is running on port:',process.env.PORT,`processId: ${process.pid}`);
//   } )
// }
const app = express()
app.use(cors({
  origin: [`${process.env.FRONT_END_URL}`],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id','token'],
}));


app.use(express.json());

app.listen(process.env.PORT ,() => {
  console.log('backend is running on port:',process.env.PORT);
} )


mongoose.connect(process.env.MONGO_DB)
        .then(() => console.log("DB connect successfully"))
        .catch((err) => console.log(err))


app.use(bodyParser.json()); 
app.use(cookieParser());

app.use('/api/post', postRoute)
app.use('/api/auth', authRoute)
app.use('/api/user', userRoute)
app.use('/api/comment', commentRoute)
app.use ('/api/report-comment', reportCommentRoute)
app.use('/api/comment-emotion', commentEmotionRoute)
app.use('/api/post-emotion', postEmotionRoute)
app.use('/api/chat', chatRoute )
app.use('/api/message', messageRoute)
app.use('/api/redis', redisRoute)
app.use('/api/notification', notificationRoute)
app.use('/api/visit', visitRoute)
// Session setup
app.use(
    session({
      secret: process.env.SESSION_SECRET ,
      resave: false,
      saveUninitialized: true,
    })
);

  // Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport with Google Strategy
passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACK_END_URL}/auth/google/callback`
      },
      (accessToken, refreshToken, profile, done) => {
       
        return done(null, profile, accessToken);
      }
    )
  );

  // Serialize user
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user
passport.deserializeUser((user, done) => {
  done(null, user);
});

app.get('/', (req, res) => {
  res.send('Hello from HTTPS Express Server!');
});

// Google Auth Route
app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );
  
// Google Auth Callback
app.get(
"/auth/google/callback",
passport.authenticate("google", { failureRedirect: "/" }),
(req, res) => {
    res.redirect(`${process.env.FRONT_END_URL}/loading-resources`);

}
);
  
// User Info Route
app.get("/auth/user", async (req, res) => {
    if (req.user) {
        let limit= parseInt(10)
        let page = parseInt(1)
        const existedUser = await User.findOne({email: req.user.emails[0].value})

        // case: user already existed in db
        if(existedUser){
            const accessToken = jwt.sign(
              {
                  id: existedUser._id,
                  isAdmin: existedUser.isAdmin,
                  isReporter: existedUser.isReporter
              },
              process.env.JWT_SECRET_KEY,
              {expiresIn:"14d"}
            );
            
            // const refreshToken = jwt.sign(
            //     {
            //         id: existedUser._id,
            //         isAdmin: existedUser.isAdmin,
            //         isReporter: existedUser.isReporter
            //     },
            //     process.env.REFRESH_SECRET_KEY,
            //     {expiresIn:"2m"}
            // );

            //save accessToken in redis
            await redis.setEx(`accessToken:${accessToken}`, 1209600 , JSON.stringify({
                id: existedUser._id.toString(),
                isAdmin: existedUser.isAdmin.toString(),
                isReporter: existedUser.isReporter.toString()
            }) ) 
             
            //save refreshToken in redis
            // const pipeline = redis.multi() 
            // if(refreshToken){      
            //   pipeline.hSet(`refreshToken:${refreshToken}`,{
            //         id: existedUser._id.toString(),
            //         isAdmin: existedUser.isAdmin.toString(),
            //         isReporter: existedUser.isReporter.toString()
            //     } )  
            //     pipeline.expire(`refreshToken:${refreshToken}`, 120)       
            //     await pipeline.exec()
      
    
            //     // send cookie to client
            //     res.cookie('refreshToken', refreshToken, {
            //         httpOnly: true, // RẤT QUAN TRỌNG: Không thể truy cập bằng JavaScript phía client
            //         secure: process.env.NODE_END === 'production' ? 'lax' : 'none', // Chỉ gửi qua HTTPS trong production
            //         sameSite: process.env.NODE_ENV === 'production' ? true : false , // Bảo vệ CSRF: 'strict', 'lax', or 'none'
            //         // maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày tính bằng mili giây (phù hợp với expiresIn của token)
            //         maxAge: 2 * 60 * 1000, // 2 min  
            //         path: '/', // Cookie khả dụng trên tất cả các đường dẫn
            //     });
            // }

            const chatList = await Chat.find({
                        $and:[
                            {members: {
                                $in: [String(existedUser._id)]
                            }},
                            {$expr: { 
                                $gt: [{ $strLenCP: '$lastMessage' }, 0] }}
                        ]
                    }).sort({updatedAt: -1}).skip( limit*(page-1) ).limit(limit)
            if(chatList){

              const { password, ...others} = existedUser._doc 
              res.status(200).json({user: others, accessToken: accessToken, chatList: chatList })
            }

        // case: user not existed in db
        } else {
                const password = password_generator( 12 ,false )
                const newUser = new User({
                    username: req.user.displayName,
                    email: req.user.emails[0].value,
                    password: password,
                    img: req.user.photos[0].value || '',
                    verified: false,
                    emailVerified: true,
                    autoDelete: null
                });
            // create new user
            try {           
                const savedUser = await newUser.save();
       
                // generate accessToken
                const accessToken = jwt.sign(
                    {
                        id: savedUser._id,
                        isAdmin: savedUser.isAdmin,
                        isReporter: savedUser.isReporter
                    },
                    process.env.JWT_SECRET_KEY,
                    {expiresIn:"14d"}
                    );
                const { password, ...others} = savedUser._doc

              //   const refreshToken = jwt.sign(
              //     {
              //         id: savedUser._id,
              //         isAdmin: savedUser.isAdmin,
              //         isReporter: savedUser.isReporter
              //     },
              //     process.env.REFRESH_SECRET_KEY,
              //     {expiresIn:"2m"}
              //  );

              //save accessToken in redis
              await redis.setEx(`accessToken:${accessToken}`, 1209600 , JSON.stringify({
                id: savedUser._id.toString(),
                isAdmin: savedUser.isAdmin.toString(),
                isReporter: savedUser.isReporter.toString()
              }) ) 
               
              //save refreshToken in redis
              // const pipeline = redis.multi() 
              // if(refreshToken){      
              //     pipeline.hSet(`refreshToken:${refreshToken}`,{
              //         id: savedUser._id.toString(),
              //         isAdmin: savedUser.isAdmin.toString(),
              //         isReporter: savedUser.isReporter.toString()
              //     } )  
                  
              //     pipeline.expire(`refreshToken:${refreshToken}`, 120)       
              //     await pipeline.exec()
        
      
              //     // send cookie to client
              //     res.cookie('refreshToken', refreshToken, {
              //         httpOnly: true, // RẤT QUAN TRỌNG: Không thể truy cập bằng JavaScript phía client
              //         secure: process.env.NODE_ENV === 'production' ? true : false, // Chỉ gửi qua HTTPS trong production
              //         sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'none', // Bảo vệ CSRF: 'strict', 'lax', or 'none'
              //         // maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày tính bằng mili giây (phù hợp với expiresIn của token)
              //         maxAge: 2*60*1000, // 2 min
              //         path: '/', // Cookie khả dụng trên tất cả các đường dẫn
              //     });
              // }

              res.status(200).json({user: others, accessToken: accessToken})
                    
              } catch (err) {
                  res.status(500).json(err);
              }
        }
    } else {
        res.status(401).json({ message: "Not authenticated" });
    }
});


// Logout Route
app.get("/auth/logout", (req, res) => {
    req.logout(async() => {
      // Xóa cookie refresh token
      // res.clearCookie('refreshToken', {
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === 'production' ? true : false ,
      //   sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'none' ,
      //   path: '/',
      // });

      //delete accessToken in redis
      await redis.del(`accessToken:${req.query.accessToken}`)

      res.redirect(`${process.env.FRONT_END_URL}?logout=true`);
    });
});

// app.listen(process.env.PORT ,() => {
//     console.log('backend is running on port:',process.env.PORT);
// } )