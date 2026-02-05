import React from 'react'

function GlassCard({children,className=""}) {
  return (
    <div className={`rounded-2xl backdrop-blur-sm border border-white/20 shadow-2xl ${className}`}>{children}</div>
  )
}

export default GlassCard