import {Router} from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getUserLikedVideos,
    getVideoLikes
} from "../controllers/like.controller.js"

const router = Router()
router.use(verifyJWT)

router.route("/toggle-video-like/:videoId").post(toggleVideoLike)
router.route("/toggle-comment-like/:commentId").post(toggleCommentLike)
router.route("/toggle-tweet-like/:tweetId").post(toggleTweetLike)
router.route("/get-user-liked-videos").get(getUserLikedVideos)
router.route("/get-video-likes/:videoId").get(getVideoLikes)

export default router