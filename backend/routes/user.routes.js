import { Router } from 'express';
import { 
    acceptConnectionRequest, 
    downloadProfile, 
    getAllUserProfile, 
    getMyConnectionRequests, 
    getUserProfileAndUserBasedOnUsername, 
    register, 
    whatAreMyConnections,
    sendConnectionRequest,
    getNotifications,
    markNotificationsRead,
    getUserConnections,
    getTrendingAthletes,
    getUserStats
} from '../controllers/user.controller.js';
import { login } from '../controllers/user.controller.js';
import multer from 'multer';
import { uploadProfilePicture } from '../controllers/user.controller.js';
import { updateUserProfile } from '../controllers/user.controller.js';
import { getUserAndProfile } from '../controllers/user.controller.js';
import { updateProfileData } from '../controllers/user.controller.js';
import { sendOtp, resetPassword, googleOauth, githubOauth } from '../controllers/user.controller.js';

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `profile-${unique}${ext}`);
    }
});

const upload = multer({storage:storage});

router.route('/update_profile_picture').post(upload.single('profilePicture'),uploadProfilePicture);

router.post(['/register', '/auth/register'], register);
router.post(['/login', '/auth/login'], login);
router.post(['/auth/send_otp', '/auth/send-otp', '/send_otp', '/send-otp'], sendOtp);
router.post(['/auth/reset_password', '/auth/reset-password', '/reset_password', '/reset-password'], resetPassword);
router.post(['/auth/google_oauth', '/auth/google-oauth', '/google_oauth', '/google-oauth'], googleOauth);
router.post(['/auth/github_oauth', '/auth/github-oauth', '/github_oauth', '/github-oauth'], githubOauth);
router.route('/user_update').post(updateUserProfile);
router.route('/get_user_and_profile').get(getUserAndProfile);
router.route('/update_profile_data').post(updateProfileData);
router.route('/user/get_all_users').get(getAllUserProfile);
router.route('/user/download_resume').get(downloadProfile);
router.route('/user/send_connection_request').post(sendConnectionRequest); // ✅ CHANGED: Use correct function name
router.route('/user/getConnectionRequests').get(getMyConnectionRequests);
router.route('/user/user_connection_requests').get(whatAreMyConnections);
router.route('/user/accept_connection_request').post(acceptConnectionRequest);
router.route('/user/get_profile_based_on_username').get(getUserProfileAndUserBasedOnUsername)

router.route('/user/notifications').get(getNotifications);
router.route('/user/notifications/mark_read').post(markNotificationsRead);
router.route('/user/get_user_connections').get(getUserConnections);
router.route('/user/trending_athletes').get(getTrendingAthletes);
router.route('/user/stats').get(getUserStats);

export default router;