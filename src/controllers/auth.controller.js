import userModel from "../models/auth.model.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs";
import { uploadToImageKit, deleteFromImageKit } from "../services/imagekit.js";

const userNameRegex = /^[a-zA-Z0-9._]{3,20}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const userRegister = async (req, res) => {
    try {
        const { userName, fullName, password, email } = req.body

        if (!userName || !fullName || !password || !email) {
            return res.status(400).json({
                success: false,
                message: "userName, fullName, password and email are required"
            })
        }

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email"
            });
        }

        if (!userNameRegex.test(userName)) {
            return res.status(400).json({
                success: false,
                message: "Only letters, numbers, dots (.) and underscores (_) allowed."
            });
        }

        const userAlreadyExists = await userModel.findOne({
            $or: [{ userName }, { email }]
        });

        if (userAlreadyExists) {
            const errors = {};

            if (userAlreadyExists.userName === userName) {
                errors.userName = "Username already exists!";
            }
            if (userAlreadyExists.email === email) {
                errors.email = "Email already exists!";
            }

            return res.status(40).json({
                success: false,
                message: "User already exists!",
                errors
            });
        }

        const hashPassword = await bcrypt.hash(password, 10)

        const user = await userModel.create({
            userName, fullName, "password": hashPassword, email
        })

        const token = jwt.sign(
            {
                userId: user._id,
                fullName,
                email
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
        });

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({
            success: true,
            message: "Account Created",
            user: userResponse,
            token
        })


    } catch (error) {
        console.error("🚀 ~ userRegister ~ error:", error)
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const userLogin = async (req, res) => {
    try {
        const { userName, email, password } = req.body

        if ((!userName && !email) || !password) {
            return res.status(400).json({
                success: false,
                message: "userName, password and email are required"
            })
        }

        if (!emailRegex.test(email)) {
            return res.status(401).json({
                success: false,
                message: "Invalid Email"
            });
        }

        if (!userNameRegex.test(userName)) {
            return res.status(400).json({
                success: false,
                message: "Only letters, numbers, dots (.) and underscores (_) allowed."
            });
        }

        const user = await userModel.findOne({
            $or: [{ userName }, { email }]
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Dos't exists"
            })
        }

        const isUserPassword = await bcrypt.compare(password, user.password)

        if (!isUserPassword) {
            return res.status(401).json({
                success: false,
                message: "Wrong password"
            })
        }

        const token = jwt.sign(
            {
                userId: user._id,
                fullName: user.fullName,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
        });

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({
            success: true,
            message: `Welcome back ${user.fullName}`,
            user: userResponse,
            token
        })

    } catch (error) {
        console.error("🚀 ~ userLogin ~ error:", error)
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const userLogout = async (req, res) => {
    try {

        res.clearCookie('token', {
            httpOnly: true,
            sameSite: 'strict'
        });

        res.status(200).json({
            success: true,
            message: 'Logged out'
        })
    } catch (error) {
        console.error("🚀 ~ userLogout ~ error:", error)
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const updateProfile = async (req, res) => {
    try {
        const { userName, fullName, bio, link } = req.body
        const userId = req.id

        const user = await userModel.findById(userId).select("-password")

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            })
        }

        if (userName !== undefined) user.userName = userName;
        if (bio !== undefined) user.bio = bio;
        if (link !== undefined) user.link = link;
        if (fullName !== undefined) user.fullName = fullName;


        // img upload (agar file aayi hai)
        if (req.file) {

            // 3a. Nayi image upload karo
            const uploadResult = await uploadToImageKit(
                req.file.buffer,
                `avatar_${userId}_${Date.now()}`,
                '/avatars'
            );
            console.log("🚀 ~ updateProfile ~ uploadResult:", uploadResult)
            

            // 3b. Purani image delete karo (agar hai)
            if (user.avatarFileId) {
                await deleteFromImageKit(user.avatarFileId);
            }

            // 3c. Nayi image ki details save karo
            user.avatar = uploadResult.url;
            user.avatarFileId = uploadResult.fileId;

        } 

        await user.save();

        return res.status(200).json({
            message: 'Profile updated successfully',
            success: true,
            user
        })


    } catch (error) {
        console.error("🚀 ~ updateProfile ~ error:", error)
        return res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === "production"
                ? "Internal server error"
                : error.message
        });
    }
}

export default { userRegister, userLogin, userLogout, updateProfile }