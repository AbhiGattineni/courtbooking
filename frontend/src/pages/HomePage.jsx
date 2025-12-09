// src/pages/HomePage.jsx
import Navbar from '../components/public/Navbar';
import HeroSection from '../components/public/HeroSection';
import CourtsList from '../components/public/CourtsList';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <HeroSection />
      <CourtsList />
    </div>
  );
}
