import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Icons } from '../components/Icon';
import { useToast } from '../components/Toast';

interface AuthViewProps {
    onLogin: (guest?: boolean) => void;
}

export const AuthView = ({ onLogin }: AuthViewProps) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                showToast("Check your email for the confirmation link!", "success");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                showToast("Welcome back!", "success");
                onLogin(false);
            }
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
        } catch (error: any) {
            showToast(error.message, "error");
        }
    };

    const handleGuestLogin = () => {
        showToast("Logged in as Guest", "info");
        onLogin(true);
    };

    return (
        <div className="min-h-screen bg-app-bg flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Animations */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand-purple/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

            <div className="w-full max-w-md bg-app-card/50 backdrop-blur-xl border border-app-border rounded-2xl shadow-2xl p-8 relative z-10 animate-slide-up">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-brand-dark to-black rounded-2xl mx-auto flex items-center justify-center border border-white/10 shadow-lg mb-4">
                        <Icons.Disc className="w-8 h-8 text-brand-accent animate-[spin_10s_linear_infinite]" />
                    </div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-brand-light tracking-tighter">MTc Player</h1>
                    <p className="text-app-subtext text-sm mt-2">Sonic Intelligence</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-app-subtext uppercase tracking-wider mb-1">Email</label>
                        <div className="relative">
                            <Icons.Mail className="absolute left-3 top-3 w-5 h-5 text-app-subtext" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-app-bg border border-app-border rounded-xl py-3 pl-10 pr-4 text-app-text focus:ring-2 focus:ring-brand-accent outline-none transition-all"
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-app-subtext uppercase tracking-wider mb-1">Password</label>
                        <div className="relative">
                            <Icons.Lock className="absolute left-3 top-3 w-5 h-5 text-app-subtext" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-app-bg border border-app-border rounded-xl py-3 pl-10 pr-4 text-app-text focus:ring-2 focus:ring-brand-accent outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-brand-accent hover:bg-brand-light text-white rounded-xl font-bold shadow-lg shadow-brand-accent/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Icons.Loader className="w-5 h-5 animate-spin" />}
                        {isSignUp ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-app-border"></div></div>
                    <div className="relative flex justify-center text-sm"><span className="px-2 bg-app-card text-app-subtext">Or continue with</span></div>
                </div>

                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full py-3 bg-white text-black hover:bg-gray-100 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                        Google Account
                    </button>
                    <button
                        type="button"
                        onClick={handleGuestLogin}
                        className="w-full py-3 bg-app-surface border border-app-border hover:bg-app-border text-app-text rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <Icons.User className="w-5 h-5" />
                        Continue as Guest
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-app-subtext">
                        {isSignUp ? "Already have an account?" : "Don't have an account?"}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="ml-1 text-brand-accent hover:text-brand-light font-bold hover:underline transition-colors"
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
