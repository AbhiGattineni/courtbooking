import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FaFutbol, FaCalendarCheck, FaUsers } from "react-icons/fa";
import HeroSection from "../components/public/HeroSection";
import CourtsList from "../components/public/CourtsList";

export default function HomePage() {
  const { currentUser } = useAuth();

  const features = [
    {
      icon: FaFutbol,
      title: "Premium Courts",
      desc: "Top-quality surfaces for Cricket, Football, Tennis and more.",
    },
    {
      icon: FaCalendarCheck,
      title: "Instant Booking",
      desc: "Real-time availability and 30-second booking process.",
    },
    {
      icon: FaUsers,
      title: "Community",
      desc: "Join tournaments and find players in your area.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection />

      {/* Courts Section */}
      <div className="py-8 bg-gray-50">
        <CourtsList />
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose Us?</h2>
            <p className="mt-4 text-lg text-gray-600">
              The best sports experience in the city.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((item, index) => (
              <div
                key={index}
                className="p-6 bg-gray-50 rounded-xl text-center hover:shadow-lg transition-shadow"
              >
                <item.icon className="mx-auto text-4xl text-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>

          {!currentUser && (
            <div className="mt-12 text-center">
              <Link
                to="/login"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700 transition-transform transform hover:-translate-y-1"
              >
                Book a Court Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
