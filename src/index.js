import dotenv from "dotenv";
import connectDB from "./db/index.js";
import conf from "./conf/config.js";
import {app} from "./app.js";

dotenv.config({
    path: "./.env"
})

connectDB() 
.then(() => {
    app.on("error", (err) => {
        console.log("server error: ", err);
        throw err
    })

    app.listen(conf.port || 8000, () => {
        console.log("Server is running on port: ", conf.port)
    })
})
.catch((err) => {
    console.log("MONGO db connection failed: ", err)
})