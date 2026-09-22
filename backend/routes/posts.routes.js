import { Router } from "express";
import {activeCheck, delete_comment_of_user, get_comments_by_post, increment_likes } from "../controllers/posts.controller.js";
import multer from "multer";
import { createPost } from "../controllers/posts.controller.js";
import { getAllPosts } from "../controllers/posts.controller.js";
import { deletePost } from "../controllers/posts.controller.js";
import { commentPost } from "../controllers/user.controller.js";
//import { Post } from "../models/post.model.js"; // Assuming you have a Post model defined

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const storage = multer.memoryStorage();

const upload = multer({ storage });

router.route('/').get(activeCheck);

router.route("/post").post(upload.single('media'), createPost);

router.route("/posts").get(getAllPosts);

router.route("/delete_post").post(deletePost);

router.route("/comment").post(commentPost);

router.route("/get_comments").get(get_comments_by_post);

router.route("/delete_comment").delete(delete_comment_of_user); 

router.route("/increment_post_like").post(increment_likes);




export default router;
