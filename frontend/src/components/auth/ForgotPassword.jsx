import React, { useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";
import Card from "../common/Card";
import Button from "../common/Button";

export default function ForgotPassword() {
    const emailRef = useRef();
    const { resetPassword } = useAuth();
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setMessage("");
            setError("");
            setLoading(true);
            await resetPassword(emailRef.current.value);
            setMessage("Check your inbox for further instructions");
        } catch {
            setError("Failed to reset password");
        }

        setLoading(false);
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card className="p-8 shadow-lg">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">Password Reset</h2>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 rounded p-3 mb-4 text-sm">
                            {error}
                        </div>
                    )}
                    {message && (
                        <div className="bg-green-50 border border-green-200 text-green-600 rounded p-3 mb-4 text-sm">
                            {message}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                ref={emailRef}
                                required
                                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Enter your email"
                            />
                        </div>
                        <Button
                            disabled={loading}
                            type="submit"
                            className="w-full mb-4 shadow-sm"
                        >
                            Reset Password
                        </Button>
                    </form>
                    <div className="w-100 text-center mt-4 text-gray-600">
                        <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">Log In</Link>
                    </div>
                </Card>
                <div className="w-100 text-center mt-2 text-gray-600">
                    Need an account? <Link to="/signup" className="text-blue-600 hover:text-blue-800 font-medium">Sign Up</Link>
                </div>
            </div>
        </div>
    );
}
