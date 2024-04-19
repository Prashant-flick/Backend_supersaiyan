import {asyncHandler} from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js";
import {Playlist} from '../models/playlist.model.js';
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponce } from "../utils/apiResponce.js";
import mongoose from "mongoose";
import conf from "../conf/config.js"
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        
        return {accessToken, refreshToken};
    } catch (error) {
        throw new apiError(500, "error while generating access and refresh tokens");
    }
}

const registerUser = asyncHandler(async (req, res) => {

    const {fullName, email, username, password} = req.body

    if(
        [fullName, email, username, password].some((feild) => 
            feild?.trim() === ""
        )
    ){
        throw new apiError(400, "All feilds are required");
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new apiError(409, "User already exists");
    }

    const user = await User.create({
        fullName,
        email,
        username: username.toLowerCase(),
        password,
        avatar: 'https://res.cloudinary.com/dbmlz6pip/image/upload/v1713336824/yvcn1vbdpxg5ftjxfveb.jpg',
        coverImage: "",
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new apiError(500, "User not created");
    }

    const playlist = await Playlist.create({
        name: 'WatchLater',
        description: 'WatchLater playlist',
        videos: [],
        owner: user?._id
    })

    return res.status(201).json(
        new apiResponce(
            200,
            createdUser,
            "user registered Succesfully" ,
        )
    )

});

const loginUser = asyncHandler(async (req, res) => {

    const {username, password, email} = req.body

    if( !username && !email){
        throw new apiError(400, "username or email is required");
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })
 
    if(!user){
        throw new apiError(404, "user does not exists");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if(!isPasswordCorrect){
        throw new apiError(401, "invalid user credentials");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )


    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
        new apiResponce(
            200,
            {
                user: loggedInUser, refreshToken, accessToken
            },
            "user logged in successfully"
        ),
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            },
            
        },
        {
            new: true,
        }
    )
    .select("-password") 

    if(!user){
        throw new apiError(404, "user not found")
    }

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(
        new apiResponce(
            200,
            user,
            "user logged out successfully"
        )
    )

})

const refreshAccessToken = asyncHandler(async (req,res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new apiError(401, "refresh token is required");
    }

    try {
        const decodeToken = jwt.verify(incomingRefreshToken, conf.refreshTokenSecret);
         
        const user = await User.findById(decodeToken?._id)
    
        if(!user){
            throw new apiError(401, "user not found or token is invalid");
        }
    
        if(incomingRefreshToken !== user.refreshToken){
            throw new apiError(401, "invalid refresh token");
        }
    
        const options = {
            httponly: true,
            secure: true,
        }
    
        const {accessToken, newrefreshToken} = await generateAccessAndRefreshToken(user._id);
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newrefreshToken, options)
        .json(
            new apiResponce(
                200,
                {
                    accessToken, "refreshToken": newrefreshToken
                },
                "access token refreshed successfully"
            )
        )
    } catch (error) {
        throw new apiError(401, error?.message || "invalid refresh token");
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {

    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id);

    if(!user){
        throw new apiError(404, "user not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new apiError(401, "invalid password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(new apiResponce(200, {}, "password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200)
    .json(
        new apiResponce(200, req.user, "current user fetch succesfully")
    )
})

const deleteCurrentUser = asyncHandler( async(req, res)=> {
    const user = await User.findByIdAndDelete(req.user._id).select("-password");

    if(!user){
        throw new apiError(404, "user not found")
    }

    //delete files from cloudinary
    let oldavatar = req.user?.avatar;
    oldavatar = oldavatar.split('/')[7];
    oldavatar = oldavatar.split('.')[0]

    let oldcoverImage = req.user?.coverImage;
    oldcoverImage = oldcoverImage.split('/')[7];
    oldcoverImage = oldcoverImage.split('.')[0]

    deleteFromCloudinary(oldavatar, "image")
    deleteFromCloudinary(oldcoverImage, "image")
    
    req.user = null;

    const options = {
        httpOnly: true,
        secure: true,
    }

    res.status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(
        new apiResponce(200, user, "user deleted succesfully")
    )
})

const updateAccountDetails = asyncHandler( async(req, res) => {
    const {email, fullName} = req.body


    if(!email && !fullName){
        throw new apiError(400, "All feild are required")
    }

    let user = await User.findById(req.user?._id)
    if(email){
        user.email = email
    }
    if(fullName){
        user.fullName = fullName
    }

    user = await user.save({validateBeforeSave: false})

    return res.status(200).json(
        new apiResponce(200, user, "account details updated succesfully")
    )
})

const updateAvatarDetails = asyncHandler( async(req, res) => {
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new apiError(400, "avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new apiError(500, 'server error while uploading image');
    }

    // getting cloudinary avatar file name
    let oldavatar = req.user?.avatar;
    oldavatar = oldavatar.split('/');
    oldavatar = oldavatar[7];
    oldavatar = oldavatar.split('.')[0]

    deleteFromCloudinary(oldavatar);

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set :{
                avatar: avatar.url
            }
        },
        {
            new :true,
        }
    ).select("-password");

    return res
    .status(200)
    .json(
        new apiResponce(
            200,
            user,
            "avatar updated succesfully"
        )
    )
})

const updateCoverImageDetails = asyncHandler( async(req, res) => {
    // if(!req.user){
    //     throw new apiError(401, "user not logged in" );
    // }

    const coverImageLocalPath = req.file?.path;
    console.log(coverImageLocalPath);

    if(!coverImageLocalPath){
        throw new apiError(400, "coverImage file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        throw new apiError(500, 'server error while uploading image');
    }

    let oldcoverImage = req.user?.coverImage;
    if(oldcoverImage){
        oldcoverImage = oldcoverImage.split('/');
        oldcoverImage = oldcoverImage[7];
        oldcoverImage = oldcoverImage.split('.')[0]
        deleteFromCloudinary(oldcoverImage);
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set :{
                coverImage: coverImage.url
            }
        },
        {
            new :true,
        }
    ).select("-password");

    return res
    .status(200)
    .json(
        new apiResponce(
            200,
            user,
            "coverImage updated succesfully"
        )
    )
})

const getUserChannelProfile = asyncHandler( async(req, res) => {
    const {username} = req.params;
    const {id} = req.query;

    if(!username && !id){
        throw new apiError(400, "username or id required");
    }

    const channel = await User.aggregate([
        {
            $match:{
                $or: [
                    (username!="null" && !id) ? {username : username} : {username: ""},
                    (id && username=="null") ? {_id: new mongoose.Types.ObjectId(id)} : {_id: "" },
                    (id && username) ? {username: username} : {username: ""}
                ]
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            }
        },
        {
            $addFields: {
                subscribersCount : {
                    $size: "$subscribers",
                },
                SubscribedToCount: {
                    $size: "$subscribedTo",
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [new mongoose.Types.ObjectId(req.user?._id), "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                SubscribedToCount: 1,
                email: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                check: 1,
            }
        }
    ])


    if(!channel || channel.length<1){
        throw new apiError(404, "Channel does not exist");
    }

    return res.status(200)
    .json(
        new apiResponce(200, channel[0] , "channel fetch succesfully")
    )
})

const getwatchHistory = asyncHandler( async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id :  new mongoose.Types.ObjectId(req.user?._id),
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as : "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                    }
                                },
                                {
                                    $addFields: {
                                        owner: {
                                            $first: "$owner",
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])


    res.status(200)
    .json(
        new apiResponce(200, user[0]?.watchHistory, "watchHistory fetched succesfully")
    )
})

const getUserbyId = asyncHandler( async(req, res) => {
    const {id} = req.params;

    if(!id){
        throw new apiError(404, "userid is required")
    }

    const user = await User.findById(id).select("-password");
    
    if(!user){
        throw new apiError(404, "user not found")
    }

    return res.status(200)
    .json(
        new apiResponce(200, user, "user fetched successfully")
    )
})

export {
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
    getUserbyId,
    generateAccessAndRefreshToken,
}

