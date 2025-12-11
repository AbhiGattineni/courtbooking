import { Outlet } from 'react-router-dom';
import Navbar from '../public/Navbar';

export default function Layout() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-grow">
                <Outlet />
            </main>
        </div>
    );
}
