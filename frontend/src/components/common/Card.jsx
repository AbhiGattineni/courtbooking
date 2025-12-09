// src/components/common/Card.jsx
export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
