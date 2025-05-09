
const bodyParser = require('body-parser');
const express = require('express')
const cors = require('cors')

const dotenv = require('dotenv')
dotenv.config()
const app = express()
const mongoose = require('mongoose')

const postRoute = require('./routes/post')
const authRoute = require('./routes/auth')
const userRoute = require('./routes/user')

mongoose.connect(process.env.MONGO_DB)
        .then(() => console.log("DB connect successfully"))
        .catch((err) => console.log(err))

app.use(cors({
    origin: `${process.env.FRONT_END_URL}`,
    credentials: false,
}));
app.use(express.json());
app.use(bodyParser.json()); 


app.use('/api/post', postRoute)
app.use('/api/auth', authRoute)
app.use('/api/user', userRoute)
// app.use('/api/auth', authRoute);

app.listen(process.env.PORT ,() => {
    console.log('backend is running on port:',process.env.PORT);
} )