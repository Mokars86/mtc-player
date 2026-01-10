import React from 'react';
import { AppView } from '../../types';
import { Icons } from '../Icon';

interface BottomNavigationProps {
    currentView: AppView;
    setCurrentView: (view: AppView) => void;
}

export const BottomNavigation = ({ currentView, setCurrentView }: BottomNavigationProps) => {
    return (
        <nav className="fixed bottom-0 left-0 w-full h-[4.5rem] md:w-20 md:h-full md:flex-col bg-app-surface border-t md:border-t-0 md:border-r border-app-border flex items-center justify-around md:justify-center md:gap-10 z-50 transition-colors duration-300">
            <button onClick={() => setCurrentView(AppView.HOME)} className={`flex flex-col items-center gap-1 p-2 transition-colors ${currentView === AppView.HOME ? 'text-brand-accent' : 'text-app-subtext hover:text-app-text'}`}><Icons.Home className="w-6 h-6" /><span className="text-[10px] md:hidden font-medium">Home</span></button>
            <button onClick={() => setCurrentView(AppView.LIBRARY)} className={`flex flex-col items-center gap-1 p-2 transition-colors ${currentView === AppView.LIBRARY ? 'text-brand-accent' : 'text-app-subtext hover:text-app-text'}`}><Icons.Library className="w-6 h-6" /><span className="text-[10px] md:hidden font-medium">Library</span></button>

            <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-light to-brand-dark text-white shadow-lg">
                <Icons.Play className="w-6 h-6 fill-white" />
            </div>

            <button onClick={() => setCurrentView(AppView.RADIO)} className={`flex flex-col items-center gap-1 p-2 transition-colors ${currentView === AppView.RADIO ? 'text-brand-accent' : 'text-app-subtext hover:text-app-text'}`}><Icons.Radio className="w-6 h-6" /><span className="text-[10px] md:hidden font-medium">Radio</span></button>
            <button onClick={() => setCurrentView(AppView.AI_CHAT)} className={`flex flex-col items-center gap-1 p-2 transition-colors ${currentView === AppView.AI_CHAT ? 'text-brand-accent' : 'text-app-subtext hover:text-app-text'}`}><Icons.Wand2 className="w-6 h-6" /><span className="text-[10px] md:hidden font-medium">Assistant</span></button>
            <button onClick={() => setCurrentView(AppView.SETTINGS)} className={`flex flex-col items-center gap-1 p-2 transition-colors ${currentView === AppView.SETTINGS ? 'text-brand-accent' : 'text-app-subtext hover:text-app-text'}`}><Icons.Settings className="w-6 h-6" /><span className="text-[10px] md:hidden font-medium">Settings</span></button>
        </nav>
    );
};
