import {apiError} from "../utils/apiError.js"
import {apiResponce} from "../utils/apiResponce.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Subscription} from "../models/subscription.model.js"
import mongoose from 'mongoose'

const toggleSubscription = asyncHandler( async(req, res)=> {
    const {channelId} = req.params

    if(!channelId){
        throw new apiError(404, "channelId is required")
    }

    // console.log(req.user);

    let channel = await Subscription.aggregate([
        {
            $match: {
                $and: [
                    {channel: new mongoose.Types.ObjectId(channelId)},
                    {subscriber: new mongoose.Types.ObjectId(req.user?._id)}
                ]
            }
        }
    ])

    // console.log(channel);

    if(!channel || channel.length === 0){
        channel = await Subscription.create({
            channel: channelId,
            subscriber: req.user?._id
        })

        if(!channel){
            throw new apiError(500,"Failed to create new subscription")
        }

        return res.status(200)
        .json(
            new apiResponce(200, 'subscribed', "subscription toggled succesfull")
        )
    }else{
        channel = await Subscription.findByIdAndDelete(
            channel[0]?._id
        )

        if(!channel){
            throw new apiError(500, "deletion failed or toggle subscription failed")
        }

        return res.status(200)
        .json(
            new apiResponce(200, 'unsubscribed', "subscription toggled succesfull")
        )
    }
})

const getUserChannelSubscribers = asyncHandler( async(req, res)=> {
    const {channelId} = req.params;
    const {limit=10} = req.query

    if(!channelId){
        throw new apiError(404, "channelId not found")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $project: {
                subscriber: 1,
                _id:0
            }
        },
        {
            $limit: parseInt(limit)
        }
    ])

    if(!subscribers){
        throw new apiError(404, "subscribers not found")
    }

    return res.status(200)
    .json(
        new apiResponce(
            200, subscribers, "subscribers fetched successfully"
        )
    )
})

const getSubscribedChannels = asyncHandler( async(req, res) => {
    const {channelId} = req.params
    const {limit=10} = req.query

    if(!channelId){
        throw new apiError(404, "channelId not found")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $project: {
                channel: 1,
                _id:0
            }
        },
        {
            $limit: parseInt(limit)
        }
    ])

    if(!subscribers){
        throw new apiError(404, "subscribers not found")
    }

    return res.status(200)
    .json(
        new apiResponce(
            200, subscribers, "subscribed channel fetched successfully"
        )
    )

})

export{
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}