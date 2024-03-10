import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'
import conf from '../conf/config.js';
import { apiError } from './apiError.js';
          
cloudinary.config({ 
  cloud_name: conf.cloudinaryCloudName, 
  api_key: conf.cloudinaryApiKey, 
  api_secret: conf.cloudinaryApiSecret, 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        })

        console.log("file is uploaded on cloudinary: ", response);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        console.log("error while uploading file on cloudinary: ", error);
        return null;
    }
}

const deleteFromCloudinary = async(fileName, resource_type) => {
    try {
        if(!fileName){
            throw new apiError(404, "file not found")
        }

        const response = await cloudinary.uploader.destroy(fileName, {resource_type})
        return response
    } catch (error) {
        console.log("error while deleting from cloudinary", error);
        return null;
    }
}

export {
    uploadOnCloudinary,
    deleteFromCloudinary,
}