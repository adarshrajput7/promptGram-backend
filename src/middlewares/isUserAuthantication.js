import jwt from 'jsonwebtoken'
import userModel from '../models/auth.model.js';

const isUserAuth = async (req, res, next) => {
    try {
        const token =
            req.cookies?.token ||
            (req.headers.authorization?.startsWith("Bearer ")
                ? req.headers.authorization.split(" ")[1]
                : null);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized — please login"
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({
                    success: false,
                    message: "Session expired — please login again"
                });
            }
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            });
        }

        const user = await userModel.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User no longer exists"
            });
        }

        req.user = user;
        req.id = user._id;

        next();

    } catch (error) {
        console.error("🚀 ~ isUserAuth ~ error:", error);
        return res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === "production"
                ? "Internal server error"
                : error.message || "Something went wrong"
        });
    }
};

export default isUserAuth