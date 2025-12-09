// src/components/public/HeroSection.jsx
import { Link } from 'react-router-dom';
import Button from '../common/Button';

export default function HeroSection() {
  return (
    <div className="relative bg-gradient-to-br from-white via-blue-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Book Your Court in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              30 Seconds
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Find and book sports courts near you. Cricket, Football, Tennis, and more.
            Real-time availability with instant confirmation.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/courts">
              <Button variant="primary" className="text-lg px-8 py-4 shadow-md">
                Browse Courts
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="text-lg px-8 py-4">
                Get Started
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
            <div className="text-gray-600">Courts Available</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">1000+</div>
            <div className="text-gray-600">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">30 Min</div>
            <div className="text-gray-600">Slot Duration</div>
          </div>
        </div>
      </div>
    </div>
  );
}
