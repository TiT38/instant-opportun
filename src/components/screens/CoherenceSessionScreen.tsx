import React, { useEffect, useState } from 'react';
import { Play, Pause, Home, Headphones } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { BreathingGuide } from '../BreathingGuide';
import { useSessionTimer } from '../../hooks/useSessionTimer';
import { useBreathingAnimation } from '../../hooks/useBreathingAnimation';
import { useAudioManager } from '../../hooks/useAudioManager';
import { useVoiceManager } from '../../hooks/useVoiceManager';

export const CoherenceSessionScreen: React.FC = () => {
  const { 
    coherenceSettings,
    isSessionActive, 
    setSessionActive, 
    setCurrentScreen,
    audioSettings 
  } = useAppStore();
  
  const { timeRemaining, progress, startTimer, stopTimer, resetTimer } = useSessionTimer();
  const { breathingState, startBreathing, stopBreathing } = useBreathingAnimation();
  const { startAudio, stopAudio, playGong, getCurrentFrequencyName } = useAudioManager();
  const { speak, stop: stopVoice } = useVoiceManager();

  const [lastPhase, setLastPhase] = useState<'inhale' | 'exhale' | null>(null);

  // Gérer les changements de phase pour le gong
  useEffect(() => {
    if (isSessionActive && breathingState.phase !== 'idle' && breathingState.phase !== lastPhase) {
      if (lastPhase !== null && coherenceSettings.transitionEnabled && !coherenceSettings.silentMode) {
        playGong(breathingState.phase);
      }
      setLastPhase(breathingState.phase);
    }
  }, [breathingState.phase, isSessionActive, lastPhase, coherenceSettings, playGong]);

  const handleToggleSession = () => {
    if (!isSessionActive) {
      setSessionActive(true);
      
      // Démarrer l'audio de cohérence cardiaque si activé
      if (coherenceSettings.gongEnabled && !coherenceSettings.silentMode) {
        startAudio('coherence'); // Toujours utiliser la fréquence 0.1Hz pour la cohérence
      }
      
      // Démarrer le timer et la respiration avec la durée correcte
      const durationInSeconds = (coherenceSettings.duration || 5) * 60;
      startTimer(durationInSeconds);
      startBreathing(coherenceSettings.rhythm || '5-5');
      
      // Message vocal de démarrage
      if (!coherenceSettings.silentMode) {
        speak("Session de cohérence cardiaque démarrée. Respirez calmement.", true);
      }
    } else {
      setSessionActive(false);
      stopTimer();
      stopBreathing();
      stopAudio();
      stopVoice();
      setLastPhase(null);
    }
  };

  const handleGoHome = () => {
    setSessionActive(false);
    stopTimer();
    stopBreathing();
    stopAudio();
    stopVoice();
    resetTimer();
    setLastPhase(null);
    setCurrentScreen('home');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="px-5 pb-5">
      {/* En-tête */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20">
            <img 
              src="/assets/logo.png" 
              alt="Instant Opportun Logo" 
              className="w-10 h-10 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<span class="text-2xl">🧘‍♀️</span>';
                  parent.classList.add('bg-gradient-to-br', 'from-cyan-400', 'to-purple-500');
                }
              }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Cohérence Cardiaque</h1>
            <p className="text-white/70">
              {coherenceSettings.duration} min - Rythme {coherenceSettings.rhythm}
            </p>
            <p className="text-sm text-white/50">
              Durée totale : {coherenceSettings.duration}:00
            </p>
          </div>
        </div>

        {/* Indication importante sur les écouteurs */}
        {!coherenceSettings.silentMode && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-3 mb-4 flex items-start gap-3">
            <Headphones size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm text-blue-200 font-medium mb-1">Important :</p>
              <p className="text-xs text-blue-100/80 leading-relaxed">
                Les sons binauraux nécessitent impérativement l'utilisation d'écouteurs stéréo pour créer l'effet de battement binaural entre les deux oreilles.
              </p>
            </div>
          </div>
        )}

        {/* Fréquence audio active */}
        {coherenceSettings.gongEnabled && !coherenceSettings.silentMode && (
          <div className="bg-white/10 rounded-lg p-2 mb-4">
            <p className="text-xs text-white/70">
              🎵 Fréquence active : <span className="text-cyan-400 font-medium">Cohérence 0.1Hz</span>
            </p>
          </div>
        )}
      </div>

      {/* Guide de respiration */}
      <BreathingGuide 
        breathingState={breathingState}
        isActive={isSessionActive}
      />

      {/* Timer et progression */}
      <div className="text-center mb-8">
        <div className="text-5xl font-light mb-4 tracking-wider">
          {formatTime(timeRemaining)}
        </div>
        <div className="w-full max-w-sm mx-auto h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-sm text-white/60 mt-2">
          Progression : {Math.round(progress)}%
        </div>
      </div>

      {/* Contrôles */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={handleToggleSession}
          className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:from-blue-600 hover:to-cyan-600 transition-all duration-200"
        >
          {isSessionActive ? <Pause size={20} /> : <Play size={20} />}
          {isSessionActive ? 'Pause' : 'Commencer'}
        </button>
        <button
          onClick={handleGoHome}
          className="bg-white/10 border-2 border-white/30 text-white py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition-all duration-200"
        >
          <Home size={20} />
          Retour
        </button>
      </div>
    </div>
  );
};