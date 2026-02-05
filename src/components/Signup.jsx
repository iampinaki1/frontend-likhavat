import React from 'react'
import GlassCard from './GlassCard'
import { useState } from 'react';

function Signup() {
  const [value,setValue]=useState(false)
  return (
<div className='min-h-screen
 flex justify-center items-center'>
    <GlassCard className='text-amber-50 flex flex-col gap-3 px-10 py-6 ' >
       <h2 className=" select-none text-xl font-semibold mb-4">Sign Up</h2>

<input
  className="border select-none rounded-2xl text-center px-4 py-2
             hover:border-blue-400
             focus:outline-none focus:ring-2 focus:ring-blue-500
             transition "
  type="text"
  placeholder="EMAIL ID"
/>

<input
  className="border select-none rounded-2xl text-center px-4 py-2
             hover:border-blue-400
             focus:outline-none focus:ring-2 focus:ring-blue-500
             transition"
  type="text"
  placeholder="USERNAME"
/>

<input
  className="border select-none rounded-2xl text-center px-4 py-2
             hover:border-blue-400
             focus:outline-none focus:ring-2 focus:ring-blue-500
             transition"
  type="password"
  placeholder="PASSWORD"
/>

<input
  className="border select-none rounded-2xl text-center px-4 py-2
             hover:border-blue-400
             focus:outline-none focus:ring-2 focus:ring-blue-500
             transition"
  type="password"
  placeholder="CONFIRM PASSWORD"
/>
<div className='flex select-none justify-between'><h6>Agree to T&C</h6><input className='  border rounded-full w-5 h-5 accent-blue-500'
          type="checkbox"
          defaultChecked={value}
          id="AgreeTermsAndConditions"
          onChange={() => {
              setValue((prev) => !prev);
          }}/></div>

<button
  className="border select-none bg-blue-950 text-white rounded-2xl px-7 py-2 font-bold
             hover:bg-blue-800 hover:scale-105
             transition duration-200 cursor-pointer"
>
  Create Account
</button>

<button
  className="mt-4 select-none text-sm text-blue-400 block
             hover:text-blue-300 hover:underline
             transition cursor-pointer"
>
  Already have an account
</button>

</GlassCard>
</div>
  )
}

export default Signup