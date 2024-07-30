import {Router} from 'express'
// import {
//     generateSignature
// } from '../utils/cloudinary.js'
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router()

router.use(verifyJWT)

// router.route('/signature').post(generateSignature)

export default router