import React from 'react'
import { Outlet } from "react-router-dom";
import UpperNav from '../components/UpperNav';
import LowerNav from '../components/LowerNav';

function RootLayout() {
  return (
    <>
    <UpperNav/>
    <main>
           <Outlet />
    </main>
    <LowerNav/>
     </>
  )
}

export default RootLayout