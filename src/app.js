import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import conf from './conf/config.js'
import bodyParser from 'body-parser'

const app = express()

app.use(cors({
    origin: conf.corsOrigin,
    credentials: true
}))

app.use(express.json({limit: '16kb'}))
app.use(express.urlencoded({extended: true, limit: '30kb'}))
app.use(express.static('public'))
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }));


//router import 
import userRouter from './routes/user.router.js'
import videoRouter from './routes/video.router.js'
import subscriptionRouter from './routes/subscription.router.js'
import commentRouter from './routes/comment.router.js'
import playlistRouter from './routes/playlist.router.js'
import tweetRouter from './routes/tweet.router.js'
import likeRouter from './routes/like.router.js'

//routes delecration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/like", likeRouter);

export {app}