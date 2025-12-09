import React, { useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Card from "../common/Card";
import Button from "../common/Button";

export default function Login() {
    const emailRef = useRef();
    const passwordRef = useRef();
    const { login, loginWithGoogle } = useAuth();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Default to /courts, but prefer the "from" location state if it exists
    const from = location.state?.from?.pathname || "/courts";

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError("");
            setLoading(true);
            await login(emailRef.current.value, passwordRef.current.value);
            navigate(from, { replace: true });
        } catch {
            setError("Failed to log in");
        }

        setLoading(false);
    }

    async function handleGoogleLogin() {
        try {
            setError("");
            setLoading(true);
            await loginWithGoogle();
            navigate(from, { replace: true });
        } catch {
            setError("Failed to log in with Google");
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card className="p-8 shadow-lg">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">Log In</h2>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 rounded p-3 mb-4 text-sm">
                            {error}
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
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                                    Forgot Password?
                                </Link>
                            </div>
                            <input
                                type="password"
                                ref={passwordRef}
                                required
                                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Enter your password"
                            />
                        </div>
                        <Button
                            disabled={loading}
                            type="submit"
                            className="w-full mb-4 shadow-sm"
                        >
                            Log In
                        </Button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <Button
                            disabled={loading}
                            onClick={handleGoogleLogin}
                            type="button"
                            variant="secondary"
                            className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 mt-2"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Sign in with Google
                        </Button>
                    </form>
                    <div className="w-100 text-center mt-4 text-gray-600">
                        Need an account? <Link to="/signup" className="text-blue-600 hover:text-blue-800 font-medium">Sign Up</Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}
