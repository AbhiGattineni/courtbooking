/**
 * Organization Home Page
 * Shows venues for development testing
 */

import HeroSection from './HeroSection';
import VenuesGrid from './VenuesGrid';

export default function HomePage() {
    return (
        <div>
            {/* Hero Section */}
            <HeroSection />

            {/* Venues Grid */}
            <section style={{ backgroundColor: 'var(--color-bg-light)', padding: 'var(--space-2xl) 0' }}>
                <div className="container">
                    <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                        Our Venues
                    </h2>
                    <VenuesGrid />
                </div>
            </section>
        </div>
    );
}
