import { Router } from "express";
import {
    deleteVideo,
    getAVideobyId,
    getAllVideos,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} 
from "../controllers/video.controller.js"
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT)

router.route("/publish-video").post(
    upload.fields([
        {
            name: 'videoFile',
            maxCount: 1
        },
        {
            name: 'thumbnail',
            maxCount: 1
        },
    ]),
    publishAVideo
)
router.route("/delete-video/:videoId").delete(deleteVideo);
router.route("/update-video-details/:videoId").post(upload.single("thumbnail") ,updateVideo);
router.route("/get-video/:videoId").get(getAVideobyId)
router.route("/toggle-publish-status/:videoId").post(togglePublishStatus)

//get all-videos special
router.route("/get-all-videos").get(getAllVideos)

export default router;