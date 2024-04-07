import {Like} from '../models/like.model.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import {apiError} from '../utils/apiError.js'
import {apiResponce} from '../utils/apiResponce.js'
import mongoose from 'mongoose'

const toggleVideoLike = asyncHandler(async(req, res)=>{
    const {videoId} = req.params;

    if(!videoId){
        throw new apiError(404, "videoId is required")
    }

    console.log(req.user._id);

    let like = await Like.aggregate([
        {
            $match: {
                $and: [
                    {video : new mongoose.Types.ObjectId(videoId)},
                    {likedBy :  req.user._id}
                ]
            }
        }
    ])

    console.log(like);

    if(!like[0]){
        like = await Like.create({
            video: videoId,
            likedBy: req.user?._id
        })

        if(!like){
            throw new apiError(404, "video like creation failed")
        }

        return res.status(200)
        .json(
            new apiResponce(200, "liked", "video like toggled successfully")
        )
    }else{
        like = await Like.findByIdAndDelete(like[0]._id)

        if(!like){
            throw new apiError(404, "video like deletion failed")
        }
        return res.status(200)
        .json(
            new apiResponce(200, "unliked", "video like toggled successfully")
        )
    }
})

const toggleCommentLike = asyncHandler(async(req, res)=>{
    const {commentId} = req.params;

    if(!commentId){
        throw new apiError(404, "commentId is required")
    }

    let like = await Like.aggregate([
        {
            $match: {
                $and: [
                    {comment : new mongoose.Types.ObjectId(commentId)},
                    {likedBy :  req.user._id}
                ]
            }
        }
    ])

    if(!like[0]){
        like = await Like.create({
            comment: commentId,
            likedBy: req.user?._id
        })

        if(!like){
            throw new apiError(404, "comment like creation failed")
        }

        return res.status(200)
        .json(
            new apiResponce(200, 'like', "comment like toggled successfully")
        )
    }else{
        like = await Like.findByIdAndDelete(like[0]._id)

        if(!like){
            throw new apiError(404, "comment like deletion failed")
        }

        return res.status(200)
        .json(
            new apiResponce(200, 'dislike', "comment like toggled successfully")
        )
    }
})

const toggleTweetLike = asyncHandler(async(req, res)=>{
    const {tweetId} = req.params;

    if(!tweetId){
        throw new apiError(404, "tweetId is required")
    }

    let like = await Like.aggregate([
        {
            $match: {
                $and: [
                    {tweet : new mongoose.Types.ObjectId(tweetId)},
                    {likedBy :  req.user._id}
                ]
            }
        }
    ])

    if(!like[0]){
        like = await Like.create({
            tweet: tweetId,
            likedBy: req.user?._id
        })

        if(!like){
            throw new apiError(404, "tweet like creation failed")
        }
    }else{
        like = await Like.findByIdAndDelete(like[0]._id)

        if(!like){
            throw new apiError(404, "tweet like deletion failed")
        }
    }

    return res.status(200)
    .json(
        new apiResponce(200, like, "tweet like toggled successfully")
    )
})

const getUserLikedVideos = asyncHandler(async(req, res)=>{
    if(!req.user._id){
        throw new apiError(404, "userId is required")
    }

    const likedVideos = await Like.aggregate([
        {
            $match: {
                $and: [
                    {likedBy : req.user._id},
                    {video: {$exists: true }}
                ]
                
            }
        },
        {
            $project: {
                video: 1,
            }
        }
    ])

    if(!likedVideos && likedVideos.length === 0){
        throw new apiError(404, "no liked videos found")
    }

    return res.status(200)
    .json(
        new apiResponce(200, likedVideos, "likedvideos fetched successfully")
    )
})

const getVideoLikes = asyncHandler(async(req, res)=>{
    const {videoId} = req.params;

    if(!videoId){
        throw new apiError(404, "videoId is required")
    }

    const likes = await Like.aggregate([
        {
            $match: {
                $and: [
                    {video : new mongoose.Types.ObjectId(videoId)},
                    {likedBy : {$exists: true}}
                ]
            }
        },
        {
            $project:{
                likedBy: 1
            }
        }
    ])

    if(!likes && likes.length === 0){
        throw new apiError(404, "no likes found")
    }

    return res.status(200)
    .json(
        new apiResponce(200, likes, "likes fetched successfully")
    )
})

export{
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getUserLikedVideos,
    getVideoLikes,

}