import {asyncHandler} from '../utils/asyncHandler.js';
import {apiError} from '../utils/apiError.js';
import {apiResponce} from '../utils/apiResponce.js';
import {Playlist} from '../models/playlist.model.js';
import mongoose from 'mongoose'

const createPlaylist = asyncHandler(async( req, res) => {
    const {name, description} = req.body;
    const {videoId} = req.params;

    if(!name || !description || !videoId){
        throw new apiError(404, "all feilds are required")
    }

    const playlist = await Playlist.create({
        name: name,
        description: description,
        videos: [videoId],
        owner: req.user?._id
    })

    if(!playlist){
        throw new apiError(500, "playlist creation failed")
    }

    return res.status(200)
    .json(
        new apiResponce(200, playlist, "playlist created successfully")
    )

})

const addVideosToPlaylist = asyncHandler( async(req, res)=> {   
    const {playlistId, videoId} = req.params;

    if(!playlistId || !videoId){
        throw new apiError(404, "all fields are required");
    }

    let playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new apiError(404, "playlist not found");
    }

    const videodata = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $match: {
                videos: new mongoose.Types.ObjectId(videoId)
            }
        }
    ])


    if(videodata.length>0){
        return res.status(201)
        .json(
            new apiResponce(200, [], "Video already exists")
        )
    }

    playlist.videos.push(videoId)

    playlist = await playlist.save();

    return res.status(200)
    .json(
        new apiResponce(200, playlist, "Video added to the playlist succesfully")
    )
})

const getUserPlaylists = asyncHandler( async(req, res)=> {
    const {userId} = req.params

    if(!userId){
        throw new apiError(404, "userId is required")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $addFields : {
                firstVideo : { $arrayElemAt: ["$videos", 0] },
            }  
        },
        {
            $lookup: {
                from: "videos",
                localField: "firstVideo",
                foreignField: "_id",
                as: "firstVideo"
            }
        },
        {
            $addFields: {
                Thumbnail: "$firstVideo.thumbnail",
            }
        },
        {
            $project: {
                firstVideo: 0
            }
        }
    ])


    return res.status(200)
    .json(
        new apiResponce(200, playlist, "playlist fetched successfully")
    )
})

const getPlaylistById = asyncHandler( async(req, res) => {
    const {playlistId} = req.params;

    if(!playlistId){
        throw new apiError(404, "playlistId is required");
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw apiError(404, "playlist not found")
    }

    return res.status(200)
    .json(
        new apiResponce(200, playlist, "playlist fetched successfull")
    )
})

const removeVideoFromPlaylist = asyncHandler( async(req, res) => {
    let {videoId, playlistId} = req.params;

    let playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new apiError(404, "playlist not found")
    }

    playlist.videos = playlist.videos.filter(vid => vid.toString() !== videoId);

    playlist = await playlist.save()

    if(!playlist){
        throw new apiError(404, "playlist not found")
    }

    return res.status(200)
    .json(
        new apiResponce(200, playlist, "video removed successfully")
    )
})

const updatePlaylist = asyncHandler(async(req, res)=> {
    const {name, description} = req.body
    const {playlistId} = req.params

    if(!name && !description || !playlistId){
        throw new apiError(404, "some feilds are required")
    }
    
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name : name,
                description: description
            }
        },
        {
            new: true
        }
    )

    if(!playlist){
        throw new apiError(404, "playlist not found")
    }

    return res.status(200)
    .json(
        new apiResponce(200, playlist, "playlist updated")
    )
})

const deletePlaylist = asyncHandler(async(req, res) => {
    const {playlistId} = req.params

    if(!playlistId){
        throw new apiError(404, "playlistId is required")
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId)

    if(!playlist){
        throw new apiError(404, "playlist deletion failed")
    }

    return res.status(200)
    .json(
        new apiResponce(200, playlist, "playlist deleted successfull")
    )
})

export{
    createPlaylist,
    addVideosToPlaylist,
    getUserPlaylists,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
    removeVideoFromPlaylist
}