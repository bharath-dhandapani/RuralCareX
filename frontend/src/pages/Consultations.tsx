import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Video, Phone, Star, PhoneOff, Send, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { socket } from '../socket';

const API_URL = import.meta.env.VITE_API_URL || 'https://ruralcarex.onrender.com';

const Consultations = () => {
  const navigate = useNavigate();
  const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
  const urlRoom = queryParams.get('Room') || queryParams.get('room');

  const [doctors, setDoctors] = useState([]);
  const [inCall, setInCall] = useState(false);
  const [roomId, setRoomId] = useState('');
  const roomRef = useRef('');
  const hasJoined = useRef(false);
  
  // Chat States
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatContainerRef = useRef(null);
  const [debugStatus, setDebugStatus] = useState("Waiting for camera...");
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const iceCandidateQueue = useRef([]);

  useEffect(() => {
    // Fetch real doctors from backend
    fetch(`${API_URL}/api/doctors`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setDoctors(data.data);
      })
      .catch(err => console.error("Failed to fetch doctors:", err));

    // WebRTC Signaling handlers
    socket.on('user-connected', async () => {
      setDebugStatus("Peer connected! Creating offer...");
      if (!peerConnectionRef.current) {
        setDebugStatus("Error: PeerConnection not ready when peer joined");
        return;
      }
      try {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        socket.emit('offer', { roomId: roomRef.current, sdp: offer });
        setDebugStatus("Offer sent. Waiting for answer...");
      } catch (err) {
        setDebugStatus(`Error creating offer: ${err.message}`);
        console.error("Error creating offer:", err);
      }
    });

    socket.on('offer', async (data) => {
      setDebugStatus("Offer received! Sending answer...");
      if (!peerConnectionRef.current) {
        setDebugStatus("Error: PeerConnection not ready when offer arrived");
        return;
      }
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
        // Flush ICE queue
        iceCandidateQueue.current.forEach(async (c) => {
          try { await peerConnectionRef.current.addIceCandidate(c); } catch(e) {}
        });
        iceCandidateQueue.current = [];

        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit('answer', { roomId: data.roomId, sdp: answer });
        setDebugStatus("Answer sent! Establishing connection...");
      } catch (err) {
        setDebugStatus(`Error handling offer: ${err.message}`);
        console.error("Error handling offer:", err);
      }
    });

    socket.on('answer', async (data) => {
      setDebugStatus("Answer received! Establishing connection...");
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          // Flush ICE queue
          iceCandidateQueue.current.forEach(async (c) => {
            try { await peerConnectionRef.current.addIceCandidate(c); } catch(e) {}
          });
          iceCandidateQueue.current = [];
        } catch (err) {
          setDebugStatus(`Error setting answer: ${err.message}`);
        }
      }
    });

    socket.on('ice-candidate', async (data) => {
      if (peerConnectionRef.current && data.candidate) {
        try {
          const candidate = new RTCIceCandidate(data.candidate);
          if (peerConnectionRef.current.remoteDescription && peerConnectionRef.current.remoteDescription.type) {
            await peerConnectionRef.current.addIceCandidate(candidate);
          } else {
            iceCandidateQueue.current.push(candidate);
          }
        } catch (e) {
          console.error("Error adding ice candidate", e);
        }
      }
    });

    socket.on('chat-message', (data) => {
      setMessages(prev => [...prev, { text: data.text, sender: 'remote' }]);
    });

    // Auto-join room if provided in URL
    if (urlRoom && !hasJoined.current) {
      hasJoined.current = true;
      startCall(urlRoom, true);
    }

    return () => {
      socket.off('user-connected');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('chat-message');
    };
  }, [urlRoom]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleBookAppointment = async (doctorId) => {
    const token = localStorage.getItem('token');
    const userId = parseInt(localStorage.getItem('userId')) || 1;
    // In real app, we'd extract userId from token or localStorage
    try {
      const res = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, doctorId, date: new Date(Date.now() + 86400000).toISOString() }) // tomorrow
      });
      const data = await res.json();
      if (data.success) {
        alert('Appointment requested successfully!');
        navigate('/records');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to book appointment');
    }
  };

  const startCall = async (idToCall, isRoomName = false) => {
    const room = isRoomName ? idToCall : `room_${idToCall}_${Date.now()}`;
    setRoomId(room);
    roomRef.current = room;
    setInCall(true);

    // Get Local Media
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setDebugStatus("Camera ready. Joining virtual room...");

      // Setup Peer Connection
      const configuration = { 
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ] 
      };
      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        setDebugStatus("Connected! Video track received.");
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteVideoRef.current.play().catch(e => console.error("Play error:", e));
        }
      };

      pc.oniceconnectionstatechange = () => {
        setDebugStatus(`Connection state: ${pc.iceConnectionState}`);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { roomId: room, candidate: event.candidate });
        }
      };

      // Just join the room. First person waits, second person joining triggers 'user-connected' for the first person.
      socket.emit('join-room', room);
      setDebugStatus("Waiting for other person to join...");

      // If patient initiated the call (not via existing room ID), ring the doctor
      if (!isRoomName && localStorage.getItem('role') !== 'doctor') {
        const patientName = localStorage.getItem('name') || 'A Patient';
        socket.emit('call-doctor', { doctorId: idToCall, patientName, roomId: room });
      }
      
    } catch (err) {
      console.error("Error accessing media devices.", err);
      alert('Could not access camera/microphone.  Please ensure permissions are granted.');
      setInCall(false);
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    setInCall(false);
    setRoomId('');
    
    // Clear URL query param if it exists so it doesn't auto-join again
    if (urlRoom) {
      navigate('/consultations', { replace: true });
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    setMessages(prev => [...prev, { text: chatInput, sender: 'local' }]);
    socket.emit('chat-message', { roomId, text: chatInput });
    setChatInput('');
  };

  if (inCall) {
    return (
      <div style={{ 
        position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, 
        background: '#000', display: 'flex', flexDirection: 'column', 
        zIndex: 100, maxWidth: '480px', margin: '0 auto' 
      }}>
        {/* Remote Video Background */}
        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute' }} />
        
        {/* Header Overlay */}
        <div style={{ position: 'absolute', top: 0, width: '100%', padding: '20px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: 'white', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{'Consult Doctor'}</h3>
            <button onClick={endCall} style={{ background: '#EF4444', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PhoneOff size={20} />
            </button>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.5)', padding: '6px 12px', borderRadius: '12px', color: '#10B981', fontSize: '0.8rem', fontWeight: 600 }}>
            {debugStatus}
          </div>
        </div>

        {/* Local Video PIP */}
        <video ref={localVideoRef} autoPlay playsInline muted style={{ 
          position: 'absolute', top: '80px', right: '20px', 
          width: '90px', height: '130px', objectFit: 'cover', 
          borderRadius: '12px', border: '2px solid white', zIndex: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }} />

        {/* Instagram-style Chat Overlay */}
        <div style={{ 
          position: 'absolute', bottom: 0, width: '100%', height: '45%', 
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)',
          zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '16px'
        }}>
          
          {/* Chat Messages */}
          <div ref={chatContainerRef} style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', maxHeight: '100%', scrollbarWidth: 'none' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ 
                alignSelf: msg.sender === 'local' ? 'flex-end' : 'flex-start',
                background: msg.sender === 'local' ? 'transparent' : 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                padding: '8px 14px',
                borderRadius: '18px',
                border: msg.sender === 'local' ? '1px solid rgba(255,255,255,0.4)' : 'none',
                maxWidth: '80%',
                fontSize: '0.9rem',
                lineHeight: '1.4'
              }}>
                {msg.text}
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input 
              type="text"
              placeholder={'Message'}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              style={{ 
                flex: 1, padding: '12px 20px', borderRadius: '24px',
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
                color: 'white', fontSize: '0.95rem', outline: 'none',
                backdropFilter: 'blur(10px)'
              }}
            />
            <button type="submit" style={{ 
              background: 'transparent', border: 'none', color: 'white', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              opacity: chatInput.trim() ? 1 : 0.5
            }}>
              <Send size={24} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '100vh' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="icon-button" onClick={() => navigate(-1)} style={{ width: '40px', height: '40px' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{'Consult A Doctor'}</h1>
      </header>

      {doctors.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{'Loading Doctors'}</div>
      ) : (
        <div className="responsive-grid">
          {doctors.map((doc, idx) => (
            <div key={idx} className={`glass-card animate-slide-up delay-${idx + 1}`} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={30} color="#10B981" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{doc.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0' }}>{doc.specialty || doc.spec}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={14} color="#FBBF24" fill="#FBBF24" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{doc.rating}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button 
                  className={doc.available ? "btn-primary" : "btn-secondary"} 
                  style={{ flex: 1, padding: '10px', minWidth: '120px' }} 
                  disabled={!doc.available}
                  onClick={() => startCall(doc.id)}
                >
                  <Video size={18} />
                  {doc.available ? 'Join Call' : 'Offline'}
                </button>
                <button 
                  className="btn-secondary" 
                  style={{ flex: 1, padding: '10px', minWidth: '120px' }} 
                  onClick={() => handleBookAppointment(doc.id)}
                >
                  {'Book Appointment'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Consultations;
