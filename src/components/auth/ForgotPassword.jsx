import React, { useState } from "react";
import GlassCard from "../GlassCard";
import { toast } from "sonner";
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from "../../context/Appcontext.jsx";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [newpassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { requestPasswordReset } = useApp();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !newpassword) {
            toast.error("Please enter email and new password");
            return;
        }

        if (newpassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);
        const result = await requestPasswordReset(email, newpassword);
        setIsLoading(false);

        if (result.success) {
            toast.success("Verification code sent to your email");
            navigate("/verify-reset", { state: { tempUserId: result.data.tempUserId } });
        } else {
            toast.error(result.error);
        }
    };

    return (
        <div
            className="min-h-screen
 flex justify-center items-center"
        >
            <GlassCard >
                <form onSubmit={handleSubmit} className="text-amber-50 flex flex-col gap-3 px-10 py-6">

                    <h2 className="text-xl select-none font-semibold mb-4">Reset Password</h2>

                    <p className="text-sm text-gray-300 text-center mb-2">
                        Enter your email and your new password to receive a verification code.
                    </p>

                    <input
                        className="border rounded-2xl text-center px-4 py-2
             focus:outline-none focus:ring-2 focus:ring-blue-500
             hover:border-blue-400 transition"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        type="email"
                        placeholder="Account Email"
                    />

                    <input
                        className="border rounded-2xl text-center px-4 py-2
             focus:outline-none focus:ring-2 focus:ring-blue-500
             hover:border-blue-400 transition"
                        type="password"
                        placeholder="New Password"
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />

                    <input
                        className="border rounded-2xl text-center px-4 py-2
             focus:outline-none focus:ring-2 focus:ring-blue-500
             hover:border-blue-400 transition"
                        type="password"
                        placeholder="Confirm New Password"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />

                    <button
                        className="border bg-blue-950 text-white rounded-2xl px-4 py-2 font-bold
             hover:bg-blue-800 hover:scale-105
             transition duration-200 cursor-pointer disabled:opacity-50"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? "Sending..." : "Send Reset Code"}
                    </button>

                    <Link to="/signin"
                        className="mt-4 text-sm text-blue-400 block text-center
             hover:text-blue-300 hover:underline
             transition cursor-pointer"
                    >
                        Back to Sign In
                    </Link>
                </form>
            </GlassCard>
        </div>
    );
}

export default ForgotPassword;
