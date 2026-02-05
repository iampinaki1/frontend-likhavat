import React from 'react'
import NavIcon from "./NavIcon";
import { Home, UserPlus, MessageCircle, Plus } from "lucide-react";



function LowerNav() {
  return (
  <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-[#020617] pb-safe">
<div className="h-16 flex items-center justify-around text-white">
<NavIcon icon={<Home size={24} />} />
<NavIcon icon={<UserPlus size={24} />} />
<NavIcon icon={<Plus size={28} />} />
<NavIcon icon={<MessageCircle size={24} />} />
<img src="https://imgs.search.brave.com/_Hf9l4vUroQq5Gks-sFPdFBeNhJzsf_IU5SQ8_ZJjf4/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4t/ZnJvbnQuZnJlZXBp/ay5jb20vaG9tZS9h/bm9uLXJ2bXAvY3Jl/YXRpdmUtc3VpdGUv/cGhvdG9ncmFwaHkv/cmVpbWFnaW5lLndl/YnA" className="w-8 hover:cursor-pointer h-8 rounded-full" />
</div>
</nav>
  )
}

export default LowerNav