import React from "react";
import { Outlet } from "react-router-dom";
import UpperNav from "../components/UpperNav";
import LowerNav from "../components/LowerNav";
import Layout from "./Background";

function RootLayout() {
  return (
    <>
      <div className="flex flex-col min-h-screen">

        <UpperNav />

        <Layout className="flex-1">
          <main className="flex-1 pt-16 pb-16">
            <Outlet />
          </main>
        </Layout>

        <LowerNav />

      </div>
    </>
  );
}

export default RootLayout;
