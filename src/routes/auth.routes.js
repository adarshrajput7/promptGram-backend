import express from 'express'
import authController from '../controllers/auth.controller.js'
import isUserAuth from '../middlewares/isUserAuthantication.js'
import multer from 'multer'

const routes = express.Router()

// ✅ Multer yahin setup
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only images allowed'), false);
    }
});


routes.post('/register',authController.userRegister)
routes.post('/login',authController.userLogin)
routes.get('/logout',authController.userLogout)
routes.patch('/profile',isUserAuth,upload.single('avatar'), authController.updateProfile)

export default routes