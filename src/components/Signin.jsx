import React from 'react'
import GlassCard from './GlassCard'

function Signin() {
  return (
<div className='min-h-screen
 flex justify-center items-center'>
    <GlassCard className='text-amber-50 flex flex-col gap-3 px-10 py-6' >
   {/* <div className='text-amber-50 '>  */}
    <h2 className="text-xl select-none font-semibold mb-4">Sign In</h2>

<input
  className="border rounded-2xl text-center px-4 py-2
             focus:outline-none focus:ring-2 focus:ring-blue-500
             hover:border-blue-400 transition"
  type="text"
  placeholder="Email Id / USERNAME"
/>

<input
  className="border rounded-2xl text-center px-4 py-2
             focus:outline-none focus:ring-2 focus:ring-blue-500
             hover:border-blue-400 transition"
  type="password"
  placeholder="PASSWORD"
/>

<button
  className="border bg-blue-950 text-white rounded-2xl px-4 py-2 font-bold
             hover:bg-blue-800 hover:scale-105
             transition duration-200 cursor-pointer"
>
  Login
</button>

<button
  className="mt-4 text-sm text-blue-400 block
             hover:text-blue-300 hover:underline
             transition cursor-pointer"
>
  New Here
</button>
<button
  className="mt-4 text-sm text-blue-400 block
             hover:text-blue-300 hover:underline
             transition cursor-pointer"
>
  Forgot Password
</button>
   {/* </div> */}
</GlassCard>
</div>
  )
}

export default Signin