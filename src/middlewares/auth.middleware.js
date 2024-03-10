import conf from "../conf/config.js";
import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";


export const verifyJWT = asyncHandler(async (req, _ , next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        // console.log("here token",token);
        
        if(!token){
            throw new apiError(401, "unauthorized access");
        }
        
        const decodedToken = jwt.verify(token, conf.accessTokenSecret);
        // console.log("here decoded token", decodedToken);
    
        const user = await User.findById(decodedToken._id).select("-password -refreshToken")
        // console.log("here user: ",user);

        if(!user){
            throw new apiError(401, "invalid access token");
        }
        
        req.user = user;
        next();
    } catch (error) {
        throw new apiError(401,`jwt error:  ${error?.message} `|| "invalid access token")
    }
});