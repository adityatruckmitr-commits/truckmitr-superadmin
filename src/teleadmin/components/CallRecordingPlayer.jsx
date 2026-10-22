import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, X, SkipBack, SkipForward } from 'lucide-react-teleadmin';

const CallRecordingPlayer = ({ recordingUrl, onClose, callerName, callDate, callType }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const seekTime = (e.target.value / 100) * duration;
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value / 100;
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (isMuted) {
      audio.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const skip = (seconds) => {
    const audio = audioRef.current;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };

  const changePlaybackRate = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    audioRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = recordingUrl;
    link.download = `recording-${callDate || 'unknown'}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!recordingUrl) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Recording Available</h3>
            <p className="text-gray-600 mb-6">This call does not have a recording.</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-1">Call Recording</h3>
              <p className="text-indigo-100 text-sm">
                {callType && <span className="font-medium">{callType} • </span>}
                {callerName && <span>{callerName} • </span>}
                {callDate && new Date(callDate).toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Player */}
        <div className="p-8">
          <audio ref={audioRef} src={recordingUrl} preload="metadata" />

          {/* Waveform Visualization (Simplified) */}
          <div className="mb-6 h-20 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 mx-0.5 rounded-full transition-all duration-300 ${
                    isPlaying ? 'bg-indigo-600' : 'bg-indigo-300'
                  }`}
                  style={{
                    height: `${Math.random() * 60 + 20}%`,
                    opacity: (currentTime / duration) * 100 > (i / 50) * 100 ? 1 : 0.3,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <input
              type="range"
              min="0"
              max="100"
              value={(currentTime / duration) * 100 || 0}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #4F46E5 0%, #4F46E5 ${
                  (currentTime / duration) * 100 || 0
                }%, #E5E7EB ${(currentTime / duration) * 100 || 0}%, #E5E7EB 100%)`,
              }}
            />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            {/* Left Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => skip(-10)}
                className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
                title="Rewind 10s"
              >
                <SkipBack className="w-5 h-5 text-gray-700" />
              </button>

              <button
                onClick={togglePlay}
                className="p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors shadow-lg"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </button>

              <button
                onClick={() => skip(10)}
                className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
                title="Forward 10s"
              >
                <SkipForward className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Center Controls */}
            <button
              onClick={changePlaybackRate}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors"
            >
              {playbackRate}x
            </button>

            {/* Right Controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-gray-700" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-gray-700" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume * 100}
                  onChange={handleVolumeChange}
                  className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <button
                onClick={handleDownload}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Download Recording"
              >
                <Download className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Duration:</span>
                <span className="ml-2 font-medium text-gray-900">{formatTime(duration)}</span>
              </div>
              <div>
                <span className="text-gray-600">Speed:</span>
                <span className="ml-2 font-medium text-gray-900">{playbackRate}x</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4F46E5;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4F46E5;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default CallRecordingPlayer;
