import { ChevronDown, LogOut, Menu, Search, User } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

function Header(
  { setIsSidebarOpen, handleSignOut }: {
    setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
    handleSignOut: () => void
  } = {
      setIsSidebarOpen: () => { },
      handleSignOut: () => { }
    }
) {

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <nav className=''>
        <div className="flex z-10 items-center justify-end p-4 bg-black text-white">
          {/* <div className="flex items-center">
            <button
              className="lg:hidden"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
            >
              <Menu size={24} />
            </button>
          </div> */}

          {/* Center - Search bar */}
          <div className="hidden md:block relative max-w-[388px] w-[388px] mx-4">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search..."
              className="bg-[#F5F6FA] text-black rounded-full py-1.5 px-10 text-sm w-full focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>
          <div className="flex items-center space-x-4">
            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center text-sm rounded-lg hover:bg-gray-800 px-3 py-2 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center mr-2">
                  <User className="w-5 h-5" />
                </div>
                <span className="hidden sm:inline">John Doe</span>
                <ChevronDown className="w-[18px] h-[18px]   ml-1" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-3 text-sm text-gray-900 border-b">
                    <div className="font-medium">John Doe</div>
                    <div className="text-gray-500">john.doe@example.com</div>
                  </div>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your Profile</a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

export default Header