const User = require('./models/User')


const bodyParser = require('body-parser');
const jwt = require("jsonwebtoken");
const password_generator = require('password-generator')
const express = require('express')
const passport = require("passport");
const session = require("express-session");
const cors = require('cors')
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const dotenv = require('dotenv')
dotenv.config()
const app = express()
const mongoose = require('mongoose')

const postRoute = require('./routes/post')
const authRoute = require('./routes/auth')
const userRoute = require('./routes/user')
const commentRoute = require('./routes/comment')
const reportCommentRoute = require('./routes/reportComment')
const commentEmotionRoute = require('./routes/commentEmotion')
const postEmotionRoute = require('./routes/postEmotion')

mongoose.connect(process.env.MONGO_DB)
        .then(() => console.log("DB connect successfully"))
        .catch((err) => console.log(err))

app.use(cors({
    origin: `${process.env.FRONT_END_URL}`,
    credentials: true,
}));
app.use(express.json());
app.use(bodyParser.json()); 


app.use('/api/post', postRoute)
app.use('/api/auth', authRoute)
app.use('/api/user', userRoute)
app.use('/api/comment', commentRoute)
app.use ('/api/report-comment', reportCommentRoute)
app.use('/api/comment-emotion', commentEmotionRoute)
app.use('/api/post-emotion', postEmotionRoute)
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
       
        return done(null, profile, accessToken, refreshToken);
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
    res.redirect(`${process.env.FRONT_END_URL}?googleAuth=true`);
}
);
  
// User Info Route
app.get("/auth/user", async (req, res) => {
    if (req.user) {
        const existedUser = await User.findOne({email: req.user.emails[0].value})
        if(existedUser){
            const accessToken = jwt.sign(
                        {
                            id: existedUser._id,
                            isAdmin: existedUser.isAdmin,
                            isReporter: existedUser.isReporter
                        },
                        process.env.JWT_SECRET_KEY,
                        // {expiresIn:"1m"}
                        );
            const { password, ...others} = existedUser._doc
            res.status(200).json({user: others, accessToken: accessToken})
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
                    // {expiresIn:"1m"}
                    );
                const { password, ...others} = savedUser._doc
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
    req.logout(() => {
        res.redirect(`${process.env.FRONT_END_URL}?logout=true`);
    });
});

app.listen(process.env.PORT ,() => {
    console.log('backend is running on port:',process.env.PORT);
} )