import React, { useRef, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { go2rtcManager } from '@/lib/go2rtc-manager';

const Go2RTCPlayer = ({ 
  camera, 
  onConnectionChange, 
  className = "" 
}) => {
  const videoRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const [streamType, setStreamType] = useState('webrtc'); // webrtc, hls, mp4
  const [isConnecting, setIsConnecting] = useState(false);
  const lastCameraRef = useRef(null);

  useEffect(() => {
    // Auto-connect when camera changes (only once per camera)
    const currentCameraKey = camera ? `${camera.$id}_${camera.name}` : null;
    
    if (camera && camera.name && 
        connectionStatus === 'disconnected' && 
        !isConnecting &&
        lastCameraRef.current !== currentCameraKey) {
      
      console.log(`🎥 Go2RTCPlayer: Auto-connecting to ${camera.name}`);
      lastCameraRef.current = currentCameraKey;
      connectToStream();
    }
    
    return () => {
      disconnect();
    };
  }, [camera?.name, camera?.$id]); // Only depend on camera identity, not status

  const connectToStream = async () => {
    // Prevent multiple simultaneous connection attempts
    if (isConnecting || connectionStatus === 'connecting') {
      console.log('⏸️ Connection already in progress, ignoring duplicate request');
      return;
    }

    try {
      setIsConnecting(true);
      setConnectionStatus('connecting');
      setError(null);
      onConnectionChange?.('connecting');

      console.log(`🎥 Connecting to go2rtc stream for ${camera.name}`);
      
      // Generate proper multi-tenant stream ID
      const streamId = go2rtcManager.generateStreamId(
        camera.organizationId, 
        camera.$id, 
        camera.name
      );
      console.log(`📡 Stream ID: ${streamId}`);

      // Ensure camera is registered with go2rtc
      await go2rtcManager.addStream(camera);

      // Wait a moment for go2rtc to initialize the stream
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Try different streaming methods in order of preference
      await tryWebRTC(streamId);

    } catch (error) {
      console.error('go2rtc connection error:', error);
      setError(error.message);
      setConnectionStatus('error');
      onConnectionChange?.('error');
    } finally {
      setIsConnecting(false);
    }
  };

  const tryWebRTC = async (streamId) => {
    console.log('🌐 Attempting WebRTC playback...');
    
    try {
      
      // Create RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      // Handle incoming stream
      pc.ontrack = (event) => {
        console.log('📺 WebRTC track received');
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
          setConnectionStatus('connected');
          onConnectionChange?.('connected');
          toast.success(`Connected to ${camera.name} via WebRTC`);
        }
      };

      // Add transceiver for receiving video
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Use proxy for WebRTC signaling
      const response = await fetch('/api/go2rtc-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'webrtc',
          streamId,
          offer: {
            type: offer.type,
            sdp: offer.sdp
          }
        })
      });

      if (!response.ok) {
        throw new Error(`WebRTC API error: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        // Parse the SDP answer from go2rtc
        const answer = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
        await pc.setRemoteDescription(answer);
      } else {
        throw new Error('Invalid WebRTC response from proxy');
      }

      console.log('✅ WebRTC connection established');

    } catch (error) {
      console.log('❌ WebRTC failed:', error.message);
      console.log('🔄 Trying HLS...');
      await tryHLS(streamId);
    }
  };

  const tryHLS = async (streamId) => {
    console.log('📺 Attempting HLS playback...');
    
    try {
      // Use proxy for HLS stream
      videoRef.current.src = `/api/go2rtc-proxy?endpoint=api/hls&src=${streamId}`;
      
      // Try native HLS support first
      if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.load();
        
        videoRef.current.onloadedmetadata = () => {
          console.log('✅ Native HLS stream ready');
          setConnectionStatus('connected');
          onConnectionChange?.('connected');
          toast.success(`Connected to ${camera.name} via HLS`);
        };

        videoRef.current.onerror = () => {
          console.log('❌ Native HLS failed, trying MP4...');
          // Clear this error handler to prevent loops
          videoRef.current.onerror = null;
          tryMP4(streamId);
        };

        return;
      }

      // Try HLS.js for browsers without native support
      const Hls = await import('hls.js');
      
      if (Hls.default.isSupported()) {
        const hls = new Hls.default();
        hls.loadSource(hlsUrl);
        hls.attachMedia(videoRef.current);
        
        hls.on(Hls.default.Events.MANIFEST_PARSED, () => {
          console.log('✅ HLS.js stream ready');
          setConnectionStatus('connected');
          onConnectionChange?.('connected');
          toast.success(`Connected to ${camera.name} via HLS`);
        });

        hls.on(Hls.default.Events.ERROR, (event, data) => {
          if (data.fatal) {
            throw new Error('HLS.js failed');
          }
        });

        return;
      }

      throw new Error('HLS not supported');

    } catch (error) {
      console.log('❌ HLS failed, trying MP4...');
      await tryMP4(streamId);
    }
  };

  const tryMP4 = async (streamId) => {
    console.log('🎬 Attempting MP4 stream...');
    
    try {
      // Clear any existing event listeners to prevent loops
      if (videoRef.current) {
        videoRef.current.onloadedmetadata = null;
        videoRef.current.onerror = null;
        videoRef.current.onabort = null;
      }

      // Use proxy for MP4 stream
      videoRef.current.src = `/api/go2rtc-proxy?endpoint=api/stream.mp4&src=${streamId}`;
      
      // Set up one-time event listeners
      const handleSuccess = () => {
        console.log('✅ MP4 stream ready');
        setConnectionStatus('connected');
        onConnectionChange?.('connected');
        toast.success(`Connected to ${camera.name} via MP4`);
        cleanup();
      };

      const handleError = (error) => {
        console.log('❌ MP4 stream failed - all methods exhausted');
        setConnectionStatus('error');
        setError('Camera stream unavailable');
        onConnectionChange?.('error');
        cleanup();
      };

      const cleanup = () => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = null;
          videoRef.current.onerror = null;
        }
      };

      videoRef.current.onloadedmetadata = handleSuccess;
      videoRef.current.onerror = handleError;
      
      videoRef.current.load();

    } catch (error) {
      console.log('❌ MP4 setup failed:', error.message);
      setError('Unable to connect to camera stream');
      setConnectionStatus('error');
      onConnectionChange?.('error');
    }
  };

  const disconnect = () => {
    if (videoRef.current) {
      // Clear all event listeners
      videoRef.current.onloadedmetadata = null;
      videoRef.current.onerror = null;
      videoRef.current.onabort = null;
      
      // Clear sources
      videoRef.current.srcObject = null;
      videoRef.current.src = '';
      videoRef.current.load();
    }
    
    setConnectionStatus('disconnected');
    setError(null);
    setIsConnecting(false);
    onConnectionChange?.('disconnected');
  };

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover bg-black"
        autoPlay
        muted
        playsInline
      />
      
      {connectionStatus === 'connecting' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p>Connecting to {camera.name}...</p>
          </div>
        </div>
      )}
      
      {connectionStatus === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-20">
          <div className="text-white text-center p-4">
            <p className="mb-2">❌ Connection Failed</p>
            <p className="text-sm mb-4">{error}</p>
            <button
              onClick={connectToStream}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}
      
      {connectionStatus === 'disconnected' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-white text-center">
            <div className="animate-pulse mb-2">📹</div>
            <p>Initializing camera connection...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Go2RTCPlayer;
