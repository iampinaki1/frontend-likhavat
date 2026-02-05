import React from 'react'

function UpperNav() {
  return (
    <nav className="hidden md:block fixed top-0 left-0 w-full z-50 bg-[#020617] ">
<div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between text-white">
<div className="relative font-semibold select-none text-lg group w-max">
<span className="opacity-100 group-hover:opacity-0 transition-opacity duration-200"> LIKHAVAT</span>
<span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">लिखावट</span>
</div>
<div className=" border  rounded-2xl px-2 flex gap-8 select-none text-white/70">
<span className="hover:text-white cursor-pointer">Home</span>
<span className="hover:text-white cursor-pointer">Follow</span>
<span className="hover:text-white cursor-pointer">Create+</span>
<span className="hover:text-white cursor-pointer">Messages</span>

</div>
<img src="https://imgs.search.brave.com/_Hf9l4vUroQq5Gks-sFPdFBeNhJzsf_IU5SQ8_ZJjf4/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4t/ZnJvbnQuZnJlZXBp/ay5jb20vaG9tZS9h/bm9uLXJ2bXAvY3Jl/YXRpdmUtc3VpdGUv/cGhvdG9ncmFwaHkv/cmVpbWFnaW5lLndl/YnA" className="w-8 h-8 hover:cursor-pointer select-none rounded-full" />
</div>
</nav>
  )
}

export default UpperNav