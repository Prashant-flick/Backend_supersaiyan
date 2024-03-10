import {apiResponce} from "../utils/apiResponce.js"
import {apiError} from "../utils/apiError.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Tweet} from "../models/tweet.model.js"
import mongoose from 'mongoose'

const createTweet = asyncHandler( async(req, res)=> {
    const {content} = req.body;

    if(!content){
        throw new apiError(404, "all feilds are required")
    }

    const tweet = await Tweet.create({
        content: content,
        owner: req.user?._id
    })

    if(!tweet){
        throw new apiError(404, "tweet creation failed")
    }

    return res.status(200)
    .json(
        new apiResponce(200, tweet, "tweet created successfully")
    )
})

const getUserTweets = asyncHandler( async(req, res)=>{
    const {userId} = req.params;

    if(!userId){
        throw new apiError(404, "userId is required")
    }

    const userTweets = await Tweet.aggregate([
        {
            $match: {
                owner : new mongoose.Types.ObjectId(userId)
            }
        }
    ])

    if(!userTweets || userTweets.length === 0){
        throw new apiError(404, "No Tweets found for this User")
    }

    return res.status(200)
    .json(
        new apiResponce(200, userTweets, "user tweets fetched successfull")
    )
})

const updateTweet = asyncHandler( async(req, res)=>{
    const {content} = req.body;
    const {tweetId} = req.params;

    if(!content || !tweetId){
        throw new apiError(404,"all feilds are required");
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: content
            }
        },
        {
            new: true
        }
    )

    if(!tweet){
        throw new apiError(404, "tweet not found")
    }

    return res.status(200)
    .json(
        new apiResponce(200, tweet, "tweet updated successfully")
    )
})

const deleteTweet = asyncHandler( async(req, res)=>{
    const {tweetId} = req.params;

    if(!tweetId){
        throw new apiError(404,"all feilds are required");
    }

    const tweet = await Tweet.findByIdAndDelete(tweetId)

    if(!tweet){
        throw new apiError(404, "tweet not found")
    }

    return res.status(200)
    .json(
        new apiResponce(200, tweet, "tweet deleted successfully")
    )
})

export{
    createTweet,
    updateTweet,
    deleteTweet,
    getUserTweets
}