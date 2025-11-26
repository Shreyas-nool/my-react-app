import { Link, useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../slices/authSlice";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // ✅ Logout Function
  const handleLogout = (e) => {
    e.stopPropagation();
    dispatch(logout());
    localStorage.removeItem("userInfo"); // Clear user info
    navigate("/login");
    setIsOpen(false);
  };

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-slate-200 shadow-sm z-50 relative">
      <div className="flex justify-between items-center h-12 px-8 sm:px-10 md:px-10 lg:px-20">
        {/* Logo / Title */}
        <Link to="/">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-blue-600 hover:text-blue-400 transition-all duration-300">
            SR Enterprises
          </h1>
        </Link>

        {/* User Menu */}
        {userInfo ? (
          <div ref={menuRef} className="relative flex items-center gap-2">
            {/* Profile Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-full bg-gray-200 p-2 hover:bg-gray-300 transition"
              aria-label="User menu"
            >
              <User className="h-5 w-5" />
            </button>

            {/* Username beside icon */}
            <span className="hidden sm:flex items-center gap-1 text-md font-semibold tracking-tight">
              {userInfo.name}
            </span>

            {/* Dropdown Menu */}
            {isOpen && (
              <nav className="absolute right-0 top-10 w-48 rounded-lg bg-white shadow-md border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-300 p-3">
                  <p className="text-sm leading-normal text-gray-800">
                    <span className="font-semibold block">{userInfo.name}</span>
                    <span className="text-gray-600 text-xs">{userInfo.email}</span>
                  </p>
                </div>

                {/* Profile Link */}
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </nav>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-400 transition text-sm font-medium"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
