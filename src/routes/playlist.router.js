import { Router } from "express";
import {
    getPlaylistById,
    getUserPlaylists,
    addVideosToPlaylist,
    deletePlaylist,
    removeVideoFromPlaylist,
    updatePlaylist,
    createPlaylist
} from '../controllers/playlist.controller.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()
router.use(verifyJWT)

router.route("/create-playlist/:videoId").post(createPlaylist);
router.route("/get-user-playlists/:userId").get(getUserPlaylists);
router.route("/get-playlist-by-id/:playlistId").get(getPlaylistById);
router.route("/delete-playlist/:playlistId").delete(deletePlaylist);
router.route("/remove-video-from-playlist/:playlistId/:videoId").post(removeVideoFromPlaylist);
router.route("/add-video-to-playlist/:playlistId/:videoId").post(addVideosToPlaylist)
router.route("/update-playlist/:playlistId").post(updatePlaylist)

export default router