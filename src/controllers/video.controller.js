import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { Video } from "../models/video.model.js";
import { User } from '../models/user.model.js'
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponce } from "../utils/apiResponce.js";
import mongoose from 'mongoose'

const getAllVideos = asyncHandler(async (req, res) => {
    const { limit = 9, query, sortBy, userId } = req.query

    const videos = await Video.aggregate([
        {
            $match: {
                $or: [
                    userId ? { owner: new mongoose.Types.ObjectId(userId) } : { owner: ""},
                    query ? { title: query } : {title: ""},
                    query ? { description: query } : {description: ""},
                    !userId && !query ? {} : {owner: ""}
                ] 
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $addFields: {
                owneravatar: "$user.avatar"
            }
        },
        {
            $sort: sortBy ? { title : parseInt(sortBy) } : { _id : -1}
        },
        {
            $limit: parseInt(limit)
        }
    ])

    const length = await Video.countDocuments()

    return res.status(200)
    .json(
        new apiResponce(200, {videos,length}, "videos filtered successfull")
    )
})

const getAllSubscriptionVideos = asyncHandler(async (req, res) => {
    const { limit = 9, sortBy } = req.query
    const { allsubscribedId } = req.body

    const subscribersIds = allsubscribedId.map(id => id= new mongoose.Types.ObjectId(id.channel));

    const videos = await Video.aggregate([
        {
            $match: {
                owner: { $in: subscribersIds }  
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $addFields: {
                owneravatar: "$user.avatar"
            }
        },
        {
            $sort: sortBy ? { title : parseInt(sortBy) } : { _id : -1}
        },
        {
            $limit: parseInt(limit)
        }
    ])

    const length = await Video.countDocuments()

    return res.status(200)
    .json(
        new apiResponce(200, {videos,length}, "videos filtered successfull")
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const {title , description} = req.body;

    if(!title || !description){
        throw new apiError(404, "title and description are required")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if(!videoFileLocalPath || !thumbnailLocalPath){
        throw new apiError(404, "video and thumbnail are required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!videoFile || !thumbnail){
        throw new apiError(404, "failed to upload on cloudinary")
    }

    const video = await Video.create(
        {
            title,
            description,
            videoFile: videoFile.url,
            thumbnail: thumbnail.url,
            owner: req.user._id
        },
    )

    if(!video){
        throw new apiError(500, "video not found")
    }

    return res
    .status(200)
    .json(
        new apiResponce(
            200,
            video,
            "video uploaded successfully"
        )
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    console.log(videoId);

    if(!videoId){
        throw new apiError(400, 'video id is required')
    }

    const video = await Video.findByIdAndDelete(videoId)
    console.log(video);

    if(!video){
        throw new apiError(404, "video not found")
    }

    let oldthumbnail = video?.thumbnail;
    oldthumbnail = oldthumbnail.split('/')[7];
    oldthumbnail = oldthumbnail.split('.')[0]

    let oldvideo = video?.videoFile;
    oldvideo = oldvideo.split('/')[7];
    oldvideo = oldvideo.split('.')[0];

    deleteFromCloudinary(oldthumbnail, "image");
    deleteFromCloudinary(oldvideo, "video");

    return res.status(200)
    .json(
        new apiResponce(200, video, "video deleted successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    if(!videoId){
        throw new apiError(404, "videoId not found")
    }

    const {newTitle, newDescription} = req.body;

    if(!newTitle && !newDescription){
        throw new apiError(404, "all feilds are required")
    }

    const thumbnailpath = req.file?.path;
    let newThumbnail = null;

    if(thumbnailpath){
        newThumbnail = await uploadOnCloudinary(thumbnailpath)
        if(!newThumbnail){
            throw new apiError(401, "failed to upload on cloudinary")
        }
        newThumbnail = newThumbnail.url;

        let tempvideo = await Video.findById(videoId)
        if(!tempvideo){
            throw new apiError(404, "user not found")
        }

        tempvideo = tempvideo?.thumbnail
        tempvideo = tempvideo.split('/')[7];
        tempvideo = tempvideo.split('.')[0]
        deleteFromCloudinary(tempvideo, "image");
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title: newTitle!="" ? newTitle : title,
                description: newDescription!="" ? newDescription : description,
                thumbnail : newThumbnail != "" ? newThumbnail : thumbnail,
            }
        },
        {
            new : true
        }
    )

    return res.status(200)
    .json(
        new apiResponce(200, video, "video details updated successfully")
    )
})

const getAVideobyId = asyncHandler( async (req, res) => {
    const {videoId} = req.params;
    const {isplaying} = req.query

    if(!videoId){
        throw new apiError(404, "videoId is required")
    }

    const videos = await Video.findById(videoId);
    
    if(!videos){
        throw new apiError(404, "video not found")
    }
    if(isplaying=='true'){
        videos.views = videos.views + 1;
        await videos.save({validateBeforeSave: false});
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id : new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                likedbyme : {
                    $cond : {
                        if : {
                            $in : [new mongoose.Types.ObjectId(req.user._id), "$likes.likedBy"]
                        },
                        then : true,
                        else : false
                    }
                },
                totallikes : {
                    $size : "$likes"
                }
            }
        },
        {
            $project: {
                likes: 0
            }
        }
    ])

    if(!video){
        throw new apiError(404, "video not found")
    }

    if(isplaying=='true' && JSON.stringify(req?.user?.watchHistory[0]) !== JSON.stringify(video[0]?._id)){
        const data = await User.findById(req?.user?._id)
        data.watchHistory = data.watchHistory.filter((id) => JSON.stringify(id)!==JSON.stringify(video[0]?._id))
        data.watchHistory = [video[0]?._id, ...data.watchHistory]
        await data.save({validateBeforeSave: false});
        console.log(data);
    }

    return res.status(200)
    .json(
        new apiResponce(200, video[0], "video fetched successfully")
    )
})

const togglePublishStatus = asyncHandler( async(req, res)=> {
    const {videoId} = req.params

    if(!videoId){
        throw new apiError(404, "video id not found")
    }

    let video = await Video.findById(videoId)

    if(!video){
        throw new apiError(404, "video not found")
    }

    video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video.isPublished
            }
        },
        {
            new: true
        }
    )

    return res.status(200)
    .json(
        new apiResponce(
            200,
            video,
            "video published status has been changed succesfully" 
        )
    )
})

export {
    getAllVideos,
    publishAVideo,
    deleteVideo,
    updateVideo,
    getAVideobyId,
    togglePublishStatus,
    getAllSubscriptionVideos,
    
}