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
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl mx-auto flex items-center justify-center border border-teal-500/20 shadow-lg shadow-teal-500/20 mb-4">
                        <Icons.Disc className="w-8 h-8 text-white animate-[spin_10s_linear_infinite]" />
                    </div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-app-text to-brand-accent tracking-tighter">MTc Player</h1>
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
