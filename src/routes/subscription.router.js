import {Router} from 'express'
import {
    getUserChannelSubscribers,
    getSubscribedChannels,
    toggleSubscription
} from '../controllers/subscription.controller.js'
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT)

router.route("/toggle-subscription/:channelId").post(toggleSubscription);
router.route("/get-subscribers/:channelId").get(getUserChannelSubscribers);
router.route('/get-subscribed-to/:channelId').get(getSubscribedChannels);

export default router

