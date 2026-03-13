import React, { useState } from "react";
import GlassCard from "../GlassCard";
import { toast } from "sonner";
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from "../../context/Appcontext.jsx";
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { z } from 'zod';

const signinSchema = z.object({
  email_username: z.string().min(3, "Email/Username is required"),
  password: z.string().min(1, "Password is required"),
});

function Signin() {
  const [username_EMAIL, setUsername_Email] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = signinSchema.safeParse({ email_username: username_EMAIL, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    const success = await login(username_EMAIL, password);
    setIsLoading(false);
    
    if (success) {
      toast.success("Logged in successfully");
      navigate("/");
    } else {
      toast.error("Invalid credentials or login failed");
    }
  };

  return (
    <div
      className="min-h-screen
 flex justify-center items-center"
    >
      <GlassCard className="w-[90%] max-w-md">
        {/* <div className='text-amber-50 '>  */}
        <form onSubmit={handleSubmit} className="text-amber-50 flex flex-col gap-3 px-6 sm:px-10 py-8">

          <h2 className="text-xl select-none font-semibold mb-4">Sign In</h2>

          <input
            className="border rounded-2xl text-center px-4 py-2
             focus:outline-none focus:ring-2 focus:ring-blue-500
             hover:border-blue-400 transition"
            onChange={(e) => setUsername_Email(e.target.value)}
            required
            type="text"
            placeholder="Email Id / USERNAME"
            autoComplete="username"
          />

          <div className="relative w-full flex justify-center">
            <input
              className="border rounded-2xl text-center px-4 py-2 w-full
               focus:outline-none focus:ring-2 focus:ring-blue-500
               hover:border-blue-400 transition"
              type={showPassword ? "text" : "password"}
              placeholder="PASSWORD"
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button
            className="border bg-blue-950 text-white rounded-2xl px-4 py-2 font-bold
             hover:bg-blue-800 hover:scale-105
             transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
             flex items-center justify-center gap-2"
            type="submit"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Logging in...' : 'Login'}
          </button>

          <Link to="/signup"
            className="mt-4 text-sm text-blue-400 block
             hover:text-blue-300 hover:underline
             transition cursor-pointer"
          >
            New Here
          </Link>
          <Link to="/forgot-password"
            className="mt-4 text-sm text-blue-400 block
             hover:text-blue-300 hover:underline
             transition cursor-pointer"
          >
            Forgot Password
          </Link>
        </form>
        {/* </div> */}
      </GlassCard>
    </div>
  );
}

export default Signin;
