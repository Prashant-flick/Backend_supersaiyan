const conf = {
    port: String(process.env.PORT),
    mongodbUri: String(process.env.MONGODB_URI),
    corsOrigin: String(process.env.CORS_ORIGIN),
    accessTokenSecret: String(process.env.ACCESS_TOKEN_SECRET),
    refreshTokenSecret: String(process.env.REFRESH_TOKEN_SECRET),
    accessTokenExpiry: String(process.env.ACCESS_TOKEN_EXPIRY),
    refreshTokenExpiry: String(process.env.REFRESH_TOKEN_EXPIRY),
    cloudinaryCloudName: String(process.env.CLOUDINARY_CLOUD_NAME),
    cloudinaryApiKey: String(process.env.CLOUDINARY_API_KEY),
    cloudinaryApiSecret: String(process.env.CLOUDINARY_API_SECRET),
}

export default conf