import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import { FaHome, FaCalendarAlt, FaUser, FaSignOutAlt, FaSignInAlt, FaBars, FaTimes } from 'react-icons/fa';

export default function Navbar() {
  const { currentUser: user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      console.error("Failed to log out");
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xl">CB</span>
            </div>
            <span className="text-gray-900 text-xl font-bold">Court Booking</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {!user && (
              <Link to="/" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors font-medium">
                <FaHome />
                <span>Home</span>
              </Link>
            )}
            <Link to="/courts" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors font-medium">
              <FaCalendarAlt />
              <span>Courts</span>
            </Link>
            {user && (
              <Link to="/profile" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors font-medium">
                <FaUser />
                <span>Profile</span>
              </Link>
            )}
          </div>

          {/* Desktop Auth Button */}
          <div className="hidden md:block">
            {user ? (
              // User is logged in - Profile link is in the nav links section, so we don't need a separate button here
              // We can optionally show a small profile avatar/icon here if desired, but user asked to remove logout
              // and make it as profile. The "Profile" text link exists in the nav links (line 44).
              // I will render nothing here for logged in users to clean it up, or maybe a mini profile chip.
              // Given "remove logout and make it as profile", and we already have a Profile link in the center,
              // I will just hide this section for logged in users or perhaps highlight the profile link better.
              // For now, let's keep it clean as requested.
              null
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium shadow-sm"
              >
                <FaSignInAlt />
                <span>Login / Sign Up</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none p-2"
            >
              {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {!user && (
              <Link to="/" className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">
                <FaHome />
                <span>Home</span>
              </Link>
            )}
            <Link to="/courts" className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">
              <FaCalendarAlt />
              <span>Courts</span>
            </Link>
            {user && (
              <Link to="/profile" className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">
                <FaUser />
                <span>Profile</span>
              </Link>
            )}
            <div className="mt-4 pt-4 border-t border-gray-100">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                >
                  <FaSignOutAlt />
                  <span>Log Out</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700"
                >
                  <FaSignInAlt />
                  <span>Login / Sign Up</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
