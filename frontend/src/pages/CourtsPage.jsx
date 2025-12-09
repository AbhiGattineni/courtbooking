// src/pages/CourtsPage.jsx
import Navbar from '../components/public/Navbar';
import CourtsList from '../components/public/CourtsList';

export default function CourtsPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <CourtsList />
    </div>
  );
}
