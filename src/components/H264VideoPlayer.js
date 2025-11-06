'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

export default function H264VideoPlayer({ 
  camera, 
  onConnectionChange,
  className = "w-full h-full"
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (camera && camera.rtspUrl) {
      connectToStream();
    }

    return () => {
      disconnect();
    };
  }, [camera]);

  const connectToStream = async () => {
    try {
      setConnectionStatus('connecting');
      setError(null);
      onConnectionChange?.('connecting');

      console.log(`🎥 Connecting to H.264 stream for ${camera.name}`);
      const streamUrl = camera.rtspUrl || camera.streamUrl;
      console.log(`📡 Stream URL: ${streamUrl}`);
      console.log(`📡 Protocol: ${streamUrl?.startsWith('rtsps://') ? 'RTSPS (secure)' : 'RTSP'}`);

      // Try multiple approaches for H.264 playback
      await tryDirectH264Playback();

    } catch (error) {
      console.error('H.264 connection error:', error);
      setError(error.message);
      setConnectionStatus('error');
      onConnectionChange?.('error');
    }
  };

  const tryDirectH264Playback = async () => {
    if (!videoRef.current) {
      throw new Error('Video element not available');
    }

    // Skip HLS and WebRTC - go straight to direct proxy
    console.log('🔗 Attempting direct RTSP-to-HTTP proxy...');
    await tryDirectRTSPProxy();
  };

  const tryWebRTCPlayback = async () => {
    console.log('🌐 Attempting WebRTC playback...');
    
    try {
      // Try WebRTC approach
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      // Add transceiver for video
      pc.addTransceiver('video', { direction: 'recvonly' });

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to our WebRTC server
      const streamUrl = camera.rtspUrl || camera.streamUrl;
      const response = await fetch('/api/webrtc-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer: offer,
          rtspUrl: streamUrl
        })
      });

      if (!response.ok) {
        throw new Error('WebRTC server error');
      }

      const { answer } = await response.json();
      await pc.setRemoteDescription(answer);

      // Handle incoming stream
      pc.ontrack = (event) => {
        console.log('📺 WebRTC stream received');
        videoRef.current.srcObject = event.streams[0];
        videoRef.current.play();
        setConnectionStatus('connected');
        onConnectionChange?.('connected');
        toast.success(`Connected to ${camera.name} via WebRTC`);
      };

    } catch (error) {
      console.log('❌ WebRTC failed, trying direct approach...');
      await tryDirectRTSPProxy();
    }
  };

  const tryDirectRTSPProxy = async () => {
    console.log('🔗 Attempting direct RTSP proxy...');
    
    // Try our RTSP proxy that converts to HTTP stream
    const streamUrl = camera.rtspUrl || camera.streamUrl;
    const proxyUrl = `/api/rtsp-proxy?url=${encodeURIComponent(streamUrl)}`;
    
    videoRef.current.src = proxyUrl;
    videoRef.current.load();
    
    videoRef.current.onloadstart = () => {
      console.log('📺 Direct proxy stream loading...');
    };

    videoRef.current.onloadedmetadata = () => {
      console.log('📊 Video metadata loaded');
    };

    videoRef.current.oncanplay = () => {
      console.log('✅ Direct proxy stream ready');
      setConnectionStatus('connected');
      onConnectionChange?.('connected');
      toast.success(`Connected to ${camera.name} via proxy`);
    };

    videoRef.current.onwaiting = () => {
      console.log('⏳ Video waiting for data...');
    };

    videoRef.current.onstalled = () => {
      console.log('⚠️ Video stalled');
    };

    videoRef.current.onerror = (error) => {
      console.error('Direct proxy failed:', error);
      setError('Video decoding failed - camera stream may be incompatible');
      setConnectionStatus('error');
      onConnectionChange?.('error');
    };
  };

  const disconnect = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
      videoRef.current.srcObject = null;
    }

    setConnectionStatus('disconnected');
    onConnectionChange?.('disconnected');
  };

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover bg-black"
        style={{ display: connectionStatus === 'connected' ? 'block' : 'none' }}
        autoPlay
        muted
        playsInline
        controls={false}
      />
      
      {/* Connection Status Overlay */}
      {connectionStatus !== 'connected' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center text-white">
            {connectionStatus === 'connecting' && (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Connecting to H.264 stream...</p>
                <p className="text-sm text-gray-400 mt-2">Trying HLS → WebRTC → Direct proxy</p>
              </>
            )}
            
            {connectionStatus === 'error' && (
              <>
                <div className="text-red-400 text-6xl mb-4">⚠️</div>
                <p className="text-red-400 font-semibold mb-2">Connection Failed</p>
                <p className="text-sm text-gray-400 mb-4">{error}</p>
                <button
                  onClick={() => connectToStream()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🔄 Retry Connection
                </button>
              </>
            )}
            
            {connectionStatus === 'disconnected' && (
              <>
                <div className="text-gray-400 text-6xl mb-4">📹</div>
                <p className="text-gray-400">Camera Disconnected</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
