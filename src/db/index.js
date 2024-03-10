import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';
import conf from '../conf/config.js';

const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${conf.mongodbUri}/${DB_NAME}`)
        console.log(`mongodb Connected: ${connectionInstance.connection.host}`);
    }
    catch(error){
        console.log("Mongodb connection failure: ", error);
        process.exit(1);
        // throw error
    }
}

export default connectDB;