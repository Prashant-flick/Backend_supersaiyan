import { Router } from "express";
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails,
    updateAvatarDetails,
    updateCoverImageDetails, 
    getUserChannelProfile, 
    getwatchHistory, 
    deleteCurrentUser,
    getUserbyId
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser)

router.route("/login").post(loginUser)

//secure route
router.route("/logout").post(verifyJWT ,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/get-current-user").get(verifyJWT, getCurrentUser)
router.route("/delete-current-user").delete(verifyJWT, deleteCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"), updateAvatarDetails)
router.route("/update-coverImage").patch(verifyJWT, upload.single("coverImage"), updateCoverImageDetails)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/get-user-by-id/:id").get(verifyJWT, getUserbyId)
router.route("/history").get(verifyJWT, getwatchHistory)


export default router