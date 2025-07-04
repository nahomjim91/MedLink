import React, { useEffect, useState } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Monitor,
  MonitorOff,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,
  Settings,
  X,
  UserCheck,
  UserX,
  Clock,
  AlertCircle,
  User,
} from "lucide-react";

const VideoCallModal = ({
  isOpen,
  onClose,
  videoCallState,
  localVideoRef,
  remoteVideoRef,
  onAnswerCall,
  onRejectCall,
  onEndCall,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  participantName,
  isInitiator = false,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);

  // Timer for call duration
  useEffect(() => {
    let interval;
    if (videoCallState.isInCall) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [videoCallState.isInCall]);

  // Auto-hide controls
  useEffect(() => {
    if (!videoCallState.isInCall) return;
    
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls, videoCallState.isInCall]);

  // Handle mouse movement to show controls
  const handleMouseMove = () => {
    setShowControls(true);
  };

  // Format call duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.volume = newVolume / 100;
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !isMuted;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-90">
      <div 
        className={`relative bg-gray-900 rounded-lg shadow-2xl transition-all duration-300 ${
          isMinimized 
            ? 'w-80 h-60 fixed bottom-4 right-4' 
            : 'w-full h-full max-w-7xl max-h-[90vh] mx-4'
        }`}
        onMouseMove={handleMouseMove}
      >
        {/* Header */}
        <div className={`absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4 rounded-t-lg transition-opacity duration-300 ${
          showControls || !videoCallState.isInCall ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">
                  {videoCallState.isInCall ? 'In Call' : 
                   videoCallState.isReceivingCall ? 'Incoming Call' : 
                   videoCallState.isInitiating ? 'Calling...' : 'Video Call'}
                </span>
              </div>
              {videoCallState.isInCall && (
                <div className="flex items-center space-x-1 text-sm bg-black/30 px-2 py-1 rounded">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(callDuration)}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
              </button>
              {!videoCallState.isReceivingCall && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Video Area */}
        <div className="relative w-full h-full rounded-lg overflow-hidden">
          {/* Remote Video (Main) */}
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            {videoCallState.remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-white">
                <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-xl font-medium">{participantName || 'Participant'}</p>
                <p className="text-gray-400">
                  {videoCallState.isReceivingCall ? 'Incoming call...' : 
                   videoCallState.isInitiating ? 'Calling...' : 
                   'No video'}
                </p>
              </div>
            )}
          </div>

          {/* Local Video (Picture-in-Picture) */}
          {videoCallState.localStream && (
            <div className={`absolute ${isMinimized ? 'top-2 right-2 w-20 h-16' : 'top-4 right-4 w-48 h-36'} bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 border-white/20`}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!videoCallState.mediaState.video && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <VideoOff className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          )}

          {/* Connection Status */}
          {videoCallState.isInitiating && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-xl font-medium">Connecting...</p>
              </div>
            </div>
          )}

          {/* Incoming Call Overlay */}
          {videoCallState.isReceivingCall && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="text-center text-white max-w-md mx-4">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <User className="w-16 h-16 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  {videoCallState.caller?.name || 'Unknown'} is calling...
                </h3>
                <p className="text-gray-300 mb-8">
                  {videoCallState.callType === 'video' ? 'Video' : 'Audio'} call
                </p>
                
                <div className="flex justify-center space-x-6">
                  <button
                    onClick={() => onRejectCall(videoCallState.currentCallId, false)}
                    className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
                  >
                    <PhoneOff className="w-8 h-8 text-white" />
                  </button>
                  <button
                    onClick={() => onAnswerCall(videoCallState.currentCallId, true)}
                    className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
                  >
                    <Phone className="w-8 h-8 text-white" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        {videoCallState.isInCall && (
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-lg transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="flex items-center justify-center space-x-4">
              {/* Audio Control */}
              <button
                onClick={onToggleAudio}
                className={`p-3 rounded-full transition-colors ${
                  videoCallState.mediaState.audio 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {videoCallState.mediaState.audio ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>

              {/* Video Control */}
              <button
                onClick={onToggleVideo}
                className={`p-3 rounded-full transition-colors ${
                  videoCallState.mediaState.video 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {videoCallState.mediaState.video ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>

              {/* Screen Share Control */}
              <button
                onClick={onToggleScreenShare}
                className={`p-3 rounded-full transition-colors ${
                  videoCallState.mediaState.screenShare 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {videoCallState.mediaState.screenShare ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
              </button>

              {/* Volume Control */}
              <div className="flex items-center space-x-2 bg-gray-700 rounded-full px-3 py-2">
                <button onClick={toggleMute} className="text-white">
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, #4b5563 ${volume}%, #4b5563 100%)`
                  }}
                />
              </div>

              {/* End Call */}
              <button
                onClick={() => onEndCall(videoCallState.currentCallId)}
                className="p-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors text-white"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>

            {/* Peer Media State Indicators */}
            <div className="flex items-center justify-center space-x-4 mt-3">
              <div className="flex items-center space-x-2 text-white text-sm">
                <span>Participant:</span>
                <div className="flex space-x-1">
                  <div className={`w-2 h-2 rounded-full ${videoCallState.peerMediaState.audio ? 'bg-green-400' : 'bg-red-400'}`} />
                  <Mic className="w-4 h-4" />
                </div>
                <div className="flex space-x-1">
                  <div className={`w-2 h-2 rounded-full ${videoCallState.peerMediaState.video ? 'bg-green-400' : 'bg-red-400'}`} />
                  <Video className="w-4 h-4" />
                </div>
                {videoCallState.peerMediaState.screenShare && (
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <Monitor className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCallModal;