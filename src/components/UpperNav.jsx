import React, { useState, useRef, useEffect, useCallback } from "react";
import { PlusCircle, User, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/Appcontext.jsx";

function UpperNav() {
  const [createOpen, setCreateOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const createRef = useRef(null);
  const userRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(e) {
      if (createRef.current && !createRef.current.contains(e.target)) {
        setCreateOpen(false);
      }

      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <nav className="hidden md:block fixed top-0 left-0 w-full z-50 bg-[#020617] ">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between text-white">
        <div className="relative font-semibold select-none text-lg group w-max">
          <span className="opacity-100 group-hover:opacity-0 transition-opacity duration-200">
            {" "}
            LIKHAVAT
          </span>
          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            लिखावट
          </span>
        </div>
        <div className=" border  rounded-2xl px-2 flex gap-8 select-none text-white/70">
          <Link to="/">
            <span className="text-[#D4A574] hover:text-white cursor-pointer">Home</span>
          </Link>
          <Link to="/poems">
            <span className="text-[#D4A574] hover:text-white cursor-pointer">Poems</span>
          </Link>
          <Link to="/messages">
            <span className="text-[#D4A574] hover:text-white cursor-pointer">messages</span>
          </Link>
          <Link to="/follow">
            <span className="text-[#D4A574] hover:text-white cursor-pointer">Follow</span>
          </Link>


          <div ref={createRef} onClick={() => setCreateOpen(!createOpen)}>
            <div className="text-[#D4A574] hover:bg-black cursor-pointer">
              {" "}
              <PlusCircle className="w-5 h-5 m-1" />
            </div>
            {createOpen && (
              <div className="absolute mt-2 w-40 bg-[#D4A574] shadow-md rounded-md p-1">
                <Link
                  to="/create/book"
                  className="block px-3 py-2 hover:bg-black   rounded"
                >
                  Create Book
                </Link>

                <Link
                  to="/create/script"
                  className="block px-3 py-2 hover:bg-black rounded"
                >
                  Create Script
                </Link>

                <Link
                  to="/create/poem"
                  className="block px-3 py-2 hover:bg-black rounded"
                >
                  Create Poem
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserOpen(!userOpen)}
            className="flex items-center space-x-2"
          >
            <img
              src={currentUser?.profilePic || `https://ui-avatars.com/api/?name=${currentUser?.username || "U"}&background=random`}
              alt="avatar"
              className="w-8 h-8 rounded-full"
            />
          </button>

          {userOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white text-black shadow-md rounded-md p-1">
              <div className="px-3 py-2 text-sm font-semibold">
                {currentUser?.username}
              </div>

              <hr />

              <Link to={`/profile/${encodeURIComponent(currentUser?.username)}`}
                className="flex items-center px-3 py-2 hover:bg-gray-100 rounded"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Link>

              <hr />

              <button
                onClick={handleLogout}
                className="flex items-center w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default UpperNav;


