import React, { useState, useRef, useEffect } from "react";
import NavIcon from "./NavIcon";
import { Link, useNavigate } from "react-router-dom";
import { PenTool, Home, UserPlus, MessageCircle, Plus, User, LogOut } from "lucide-react";
import { useApp } from "../context/Appcontext.jsx";

function LowerNav() {
  const [createOpen, setCreateOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/signin");
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
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-[#020617] pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="h-16 flex items-center justify-around text-white px-2 relative">
        <Link to="/" className="text-[#D4A574] hover:text-white transition-colors"><NavIcon icon={<Home size={26} />} /></Link>
        <Link to="/poems" className="text-[#D4A574] hover:text-white transition-colors"><NavIcon icon={<PenTool size={26} />} /></Link>

        {/* Create Dropdown */}
        <div ref={createRef} className="relative flex items-center justify-center">
          <div
            onClick={() => setCreateOpen(!createOpen)}
            className="text-[#D4A574] hover:text-white transition-colors outline-none cursor-pointer"
            role="button"
          >
            <NavIcon icon={<Plus size={30} />} />
          </div>

          {createOpen && (
            <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-48 bg-[#D4A574] text-black shadow-lg rounded-xl p-2 transform origin-bottom">
              <Link
                to="/create/book"
                onClick={() => setCreateOpen(false)}
                className="block px-4 py-3 hover:bg-black hover:text-white rounded-lg font-medium transition-colors"
              >
                Create Book
              </Link>
              <Link
                to="/create/script"
                onClick={() => setCreateOpen(false)}
                className="block px-4 py-3 hover:bg-black hover:text-white rounded-lg font-medium transition-colors my-1"
              >
                Create Script
              </Link>
              <Link
                to="/create/poem"
                onClick={() => setCreateOpen(false)}
                className="block px-4 py-3 hover:bg-black hover:text-white rounded-lg font-medium transition-colors"
              >
                Create Poem
              </Link>
              {/* Triangle Pointer */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#D4A574] rotate-45"></div>
            </div>
          )}
        </div>

        <Link to="/messages" className="text-[#D4A574] hover:text-white transition-colors"><NavIcon icon={<MessageCircle size={26} />} /></Link>
        <Link to="/follow" className="text-[#D4A574] hover:text-white transition-colors"><NavIcon icon={<UserPlus size={26} />} /></Link>

        {/* User Profile Dropdown */}
        <div ref={userRef} className="relative flex items-center justify-center">
          <div
            onClick={() => setUserOpen(!userOpen)}
            className="outline-none cursor-pointer"
            role="button"
          >
            <img
              src={currentUser?.profilePic || `https://ui-avatars.com/api/?name=${currentUser?.username || "U"}&background=random`}
              alt="avatar"
              className="w-8 h-8 rounded-full border-2 border-transparent hover:border-[#D4A574] transition-all object-cover block"
            />
          </div>

          {userOpen && (
            <div className="absolute bottom-full mb-4 right-0 w-48 bg-white text-black shadow-lg rounded-xl p-2 transform origin-bottom">
              <div className="px-4 py-3 text-sm font-semibold truncate bg-gray-50 rounded-t-lg">
                @{currentUser?.username || 'User'}
              </div>

              <div className="h-px bg-gray-200 my-1"></div>

              <Link
                to={currentUser ? `/profile/${currentUser.username}` : '#'}
                onClick={() => setUserOpen(false)}
                className="flex items-center px-4 py-3 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                <User className="w-5 h-5 mr-3 text-gray-600" />
                Profile
              </Link>

              <div className="h-px bg-gray-200 my-1"></div>

              <button
                onClick={handleLogout}
                className="flex items-center w-full text-left px-4 py-3 hover:bg-red-50 hover:text-red-600 rounded-lg font-medium transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3 text-red-500" />
                Logout
              </button>
              {/* Triangle Pointer */}
              <div className="absolute -bottom-2 right-3 w-4 h-4 bg-white border-b border-r border-gray-100 bg-white rotate-45"></div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default LowerNav;