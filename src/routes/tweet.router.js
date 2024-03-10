import {Router} from 'express'
import {
    createTweet,
    updateTweet,
    deleteTweet,
    getUserTweets
} from '../controllers/tweet.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()
router.use(verifyJWT)

router.route('/create-Tweet').post(createTweet);
router.route('/get-user-tweets/:userId').get(getUserTweets);
router.route('/update-tweet/:tweetId').post(updateTweet);
router.route('/delete-tweet/:tweetId').delete(deleteTweet);

export default router