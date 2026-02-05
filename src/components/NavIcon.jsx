

import React from 'react'

function NavIcon({icon}) {
  return (
   <button className="w-12 hover:cursor-pointer h-12 flex items-center justify-center active:scale-95 transition">
{icon}
</button>
  )
}

export default NavIcon