import {Comment} from '../models/comment.model.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import {apiError} from '../utils/apiError.js'
import {apiResponce} from '../utils/apiResponce.js'
import mongoose from 'mongoose'

const getVideoComments = asyncHandler( async(req, res)=> { 
    const {videoId} = req.params;
    const {limit = 10, page = 1} = req.query;

    if(!videoId){
        throw new apiError(404, "videoId is required");
    }

    const comments = await Comment.aggregate([
        {
            $match: {
                video : new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $limit : limit
        }
    ])

    if(!comments){
        throw new apiError(404, "comments not found")
    }

    return res.status(200)
    .json(
        new apiResponce(200, comments, "comments fetched successfully")
    )
})

const addComment = asyncHandler( async(req, res)=> {
    const {videoId} = req.params;
    const {content} = req.query;

    if(!videoId || !content){
        throw new apiError(404, "all feilds is required")
    }

    const comment = await Comment.create({
        content : content,
        video : videoId,
        owner: req.user?._id
    })

    if(!comment){
        throw new apiError(404, "comment not created")
    }

    return res.status(200)
    .json(
        new apiResponce(200, comment, "comment created succesfully")
    )
})

const updateComment = asyncHandler( async(req, res)=> {
    const {commentId} = req.params;
    const {content} = req.query;

    if(!commentId || !content){
        throw new apiError(404, "all feilds is required")
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: content
            }
        },
        {
            new: true
        }
    )

    if(!comment){
        throw new apiError(500, "comment updation failed")
    }

    return res.status(200)
    .json(
        new apiResponce(200, comment, "comment updated successfully")
    )
})

const deleteComment = asyncHandler( async(req, res)=> {
    const {commentId} = req.params;

    if(!commentId){
        throw new apiError(404, "commentId is required")
    }

    const comment = await Comment.findByIdAndDelete(commentId);

    if(!comment){
        throw new apiError(404, "comment deletion failed")
    }

    return res.status(200)
    .json(
        new apiResponce(200, comment, "comment deleted successfully")
    )
})

export{
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}