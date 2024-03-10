import {Router} from 'express'
import {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
} from '../controllers/comment.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js';


const router = Router();
router.use(verifyJWT)

router.route("/get-video-comments/:videoId").get(getVideoComments);
router.route("/add-comment/:videoId").post(addComment);
router.route("/update-comment/:commentId").post(updateComment);
router.route("/delete-comment/:commentId").delete(deleteComment);

export default router