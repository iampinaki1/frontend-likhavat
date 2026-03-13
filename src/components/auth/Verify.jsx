import React, { useState } from 'react';
import GlassCard from '../GlassCard';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/Appcontext.jsx';
import { toast } from 'sonner';

function Verify() {
  const [code, setCode] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { verifySignup } = useApp();

  const tempUserId = location.state?.tempUserId;

  const handleVerify = async () => {
    if (!tempUserId) {
      toast.error("Session missing. Please sign up again.");
      navigate("/signup");
      return;
    }
    if (code.length !== 4) {
      toast.error("Please enter a valid 4-digit code.");
      return;
    }

    const result = await verifySignup(tempUserId, Number(code));
    if (result.success) {
      toast.success("Account verified successfully! Please set up your profile.");
      navigate('/setup-profile');
    } else {
      toast.error(result.error);
    }
  };
  return (
    <div className='h-screen flex justify-center items-center'>
      <GlassCard className=' text-black w-90 p-6 rounded-2xl shadow-xl flex flex-col items-center gap-5'>



        <h2 className="text-xl text-white select-none font-semibold">Verify Code</h2>
        <p className="text-sm text-gray-500 text-center">
          Enter the 4-digit code sent to your email
        </p>
        <input
          type="number"
          className="bg-blue-400 border rounded-2xl w-full h-10 px-3 text-center"
          value={code}
          onChange={(e) => setCode(e.target.value.slice(0, 4))}
        />


        {/* Verify button */}
        <button
          onClick={handleVerify}
          className="w-full bg-blue-950 text-white py-2 rounded-xl font-bold
                 hover:bg-blue-800 hover:scale-[1.02]
                 transition cursor-pointer"
        >
          Verify
        </button>

        {/* Resend */}
        <button
          className="text-sm text-blue-500 hover:underline cursor-pointer"
        >
          Resend code
        </button>



      </GlassCard>
    </div>)
}

export default Verify