import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const { login, signup, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/app');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setError(null);
        setSubmitting(true);

        const { error: authError } = isLogin
            ? await login(email, password)
            : await signup(email, password);

        setSubmitting(false);

        if (authError) {
            setError(authError);
            return;
        }

        if (!isLogin) {
            setError('Check your email for a confirmation link.');
            return;
        }

        navigate('/app');
    };

    return (
        <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 mx-auto bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] rounded-xl flex items-center justify-center shadow-lg mb-4">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                        {isLogin ? 'Welcome back to Nexus' : 'Create your Nexus account'}
                    </h2>
                    <p className="text-gray-400 text-sm mt-2">
                        {isLogin ? 'Sign in to access your projects' : 'Start mapping your workflow today'}
                    </p>
                </div>

                {error && (
                    <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${
                        error.includes('Check your email')
                            ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                            : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#151525] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#7C3AED] transition-colors"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#151525] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#7C3AED] transition-colors"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-[#7C3AED] hover:bg-[#8B5CF6] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-[#7C3AED]/50 hover:-translate-y-0.5 mt-6"
                    >
                        {submitting ? 'Please wait...' : isLogin ? 'Sign in' : 'Sign up'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-400 mt-6">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        type="button"
                        onClick={() => { setIsLogin(!isLogin); setError(null); }}
                        className="text-[#06B6D4] hover:text-white transition-colors cursor-pointer"
                    >
                        {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                </p>
            </div>
        </div>
    );
}
