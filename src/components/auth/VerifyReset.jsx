import React, { useState } from 'react';
import GlassCard from '../GlassCard';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp, api } from '../../context/Appcontext.jsx';
import { toast } from 'sonner';

function VerifyReset() {
    const [code, setCode] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();
    const { verifyPasswordReset } = useApp();

    const tempUserId = location.state?.tempUserId;

    const handleVerify = async () => {
        if (!tempUserId) {
            toast.error("Session missing. Please request a new code.");
            navigate("/forgot-password");
            return;
        }
        if (code.length !== 4) {
            toast.error("Please enter a valid 4-digit code.");
            return;
        }

        const result = await verifyPasswordReset(tempUserId, Number(code));
        if (result.success) {
            toast.success("Password reset successfully! Please log in with your new password.");
            navigate('/signin');
        } else {
            toast.error(result.error);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || !tempUserId) return;

        try {
            await api.post('/user/profile/resend-reset-otp', { tempUserId });
            toast.success("New code sent to your email");
            setResendCooldown(60);
            const interval = setInterval(() => {
                setResendCooldown(prev => {
                    if (prev <= 1) { clearInterval(interval); return 0; }
                    return prev - 1;
                });
            }, 1000);
        } catch (err) {
            toast.error(err.response?.data?.msg || "Failed to resend code");
        }
    };

    return (
        <div className='h-screen flex justify-center items-center'>
            <GlassCard className=' text-black w-90 p-6 rounded-2xl shadow-xl flex flex-col items-center gap-5'>
                <h2 className="text-xl text-white select-none font-semibold">Verify Password Reset</h2>
                <p className="text-sm text-gray-500 text-center">
                    Enter the 4-digit reset code sent to your email
                </p>
                <input
                    type="number"
                    className="bg-blue-400 text-white placeholder:text-white/70 border rounded-2xl w-full h-10 px-3 text-center"
                    value={code}
                    placeholder="4-Digit Code"
                    onChange={(e) => setCode(e.target.value.slice(0, 4))}
                />

                <button
                    onClick={handleVerify}
                    className="w-full bg-blue-950 text-white py-2 rounded-xl font-bold
                 hover:bg-blue-800 hover:scale-[1.02]
                 transition cursor-pointer"
                >
                    Reset Password
                </button>

                <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className="text-sm text-blue-500 hover:underline cursor-pointer pt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
            </GlassCard>
        </div>
    );
}

export default VerifyReset;
