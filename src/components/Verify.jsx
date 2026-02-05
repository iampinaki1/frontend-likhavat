import React from 'react'
import GlassCard from './GlassCard'

function Verify() {
  return (
   <div className='h-screen flex justify-center items-center'>
    <GlassCard className=' text-black w-90 p-6 rounded-2xl shadow-xl flex flex-col items-center gap-5'>


    
    <h2 className="text-xl text-white select-none font-semibold">Verify Code</h2>
    <p className="text-sm text-gray-500 text-center">
      Enter the 6-digit code sent to your email
    </p>
<input
  type="number"
  className="bg-blue-400 border rounded-2xl w-full h-10 px-3 text-center"
  onInput={(e) => {
    e.target.value = e.target.value.slice(0, 6);
  }}
/>


    {/* Verify button */}
    <button
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
   </div> )
}

export default Verify