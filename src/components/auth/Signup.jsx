import React, { useState } from 'react';
import GlassCard from '../GlassCard';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/Appcontext.jsx';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { z } from 'zod';

const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "Terms and conditions must be accepted",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

function Signup() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { signup } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = signupSchema.safeParse({ username, email, password, confirmPassword, termsAccepted });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    const result = await signup(username, password, email);
    setIsLoading(false);
    
    if (result.success) {
      toast.success('Account created! Please verify your email.');
      navigate('/verify', { state: { tempUserId: result.tempUserId } });
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className='min-h-screen
 flex justify-center items-center'>
      <GlassCard className="w-[90%] max-w-md">
        <form className='text-amber-50 flex flex-col gap-3 px-6 sm:px-10 py-8' onSubmit={handleSubmit} >
          <h2 className=" select-none text-xl font-semibold mb-4">Sign Up</h2>

          <input
            className="border select-none rounded-2xl text-center px-4 py-2
             hover:border-blue-400
             focus:outline-none focus:ring-2 focus:ring-blue-500
             transition "
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="EMAIL ID"
          />

          <input
            className="border select-none rounded-2xl text-center px-4 py-2
             hover:border-blue-400
             focus:outline-none focus:ring-2 focus:ring-blue-500
             transition"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="USERNAME"
          />

          <div className="relative w-full flex justify-center">
            <input
              className="border select-none rounded-2xl text-center px-4 py-2 w-full
               hover:border-blue-400
               focus:outline-none focus:ring-2 focus:ring-blue-500
               transition"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="PASSWORD"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative w-full flex justify-center">
            <input
              className="border select-none rounded-2xl text-center px-4 py-2 w-full
               hover:border-blue-400
               focus:outline-none focus:ring-2 focus:ring-blue-500
               transition"
              required
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="CONFIRM PASSWORD"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-white transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div className='flex select-none justify-between'><h6>Agree to T&C</h6><input className='  border rounded-full w-5 h-5 accent-blue-500'
            type="checkbox"
            required
            checked={termsAccepted}
            id="AgreeTermsAndConditions"
            onChange={(e) => setTermsAccepted(e.target.checked)} /></div>

          <button
            className="border select-none bg-blue-950 text-white rounded-2xl px-7 py-2 font-bold
             hover:bg-blue-800 hover:scale-105
             transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
             flex items-center justify-center gap-2"
            type="submit"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
          <Link to="/signin" className="mt-4 select-none text-sm text-blue-400 block
             hover:text-blue-300 hover:underline
             transition cursor-pointer">


            Already have an account
          </Link>


        </form>
      </GlassCard>
    </div>
  )
}

export default Signup