"use client";

import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, ClipboardList, UserPlus, Zap, MousePointer2 } from 'lucide-react';

const WELCOME_MESSAGES = [
  { text: "Welcome to TaskFlow!", icon: <Hand size={16} /> },
  { text: "Sign in to access tasks!", icon: <ClipboardList size={16} /> },
  { text: "Create an account today!", icon: <UserPlus size={16} /> },
  { text: "Let's boost productivity!", icon: <Zap size={16} /> },
  { text: "Drag me around!", icon: <MousePointer2 size={16} /> }
];

export const Astronaut = () => {
  const containerRef = useRef(null);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % WELCOME_MESSAGES.length);
    }, 5000); 

    return () => clearInterval(interval); 
  }, []);

  const currentMessage = WELCOME_MESSAGES[messageIndex];

  return (
    <StyledWrapper ref={containerRef}>
      {/* Stationary Deep Space Background */}
      <div className="planet planet-1" />
      <div className="moon" />
      
      <div className="box-of-stars box-1"><Stars /></div>
      <div className="box-of-stars box-2"><Stars /></div>

      {/* Draggable Astronaut Container */}
      <motion.div 
        className="draggable-container cursor-grab active:cursor-grabbing"
        drag 
        dragConstraints={containerRef}
        dragElastic={0.2}
        whileDrag={{ scale: 1.1 }}
      >
        <div className="chat-bubble">
          <AnimatePresence mode="wait">
            <motion.div
              key={messageIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {currentMessage.text}
              {currentMessage.icon} 
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pixel Astronaut Image */}
        <img 
          src="/astror.png" 
          alt="Pixel Astronaut" 
          className="pixel-astronaut" 
          draggable="false" 
        />
        
      </motion.div>
    </StyledWrapper>
  );
};

// Helper component for stars
const Stars = () => (
  <>
    <div className="star star-position1" />
    <div className="star star-position2" />
    <div className="star star-position3" />
    <div className="star star-position4" />
    <div className="star star-position5" />
    <div className="star star-position6" />
    <div className="star star-position7" />
  </>
);

const StyledWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
  overflow: hidden;
  background-color: #0b0f19; /* Deep space background */

  /* --- NEW PLANETS & MOON --- */
  .planet {
    position: absolute;
    border-radius: 50%;
  }

  .planet-1 {
    width: 200px;
    height: 200px;
    background: linear-gradient(135deg, #9333ea, #312e81);
    top: 15%;
    left: 10%;
    box-shadow: inset -25px -25px 40px rgba(0,0,0,0.6), 0 0 40px rgba(147, 51, 234, 0.2);
  }

  .moon {
    position: absolute;
    border-radius: 50%;
    width: 80px;
    height: 80px;
    background: radial-gradient(circle at 30% 30%, #f8fafc, #94a3b8);
    bottom: 25%;
    right: 15%;
    box-shadow: inset -10px -10px 20px rgba(0,0,0,0.6), 0 0 20px rgba(255, 255, 255, 0.1);
  }

  .moon::before {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    top: 20px;
    left: 20px;
    box-shadow: inset 2px 2px 4px rgba(0,0,0,0.2);
  }

  .moon::after {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    bottom: 20px;
    right: 25px;
    box-shadow: inset 1px 1px 3px rgba(0,0,0,0.2);
  }

  /* --- INTERACTIVE ELEMENTS --- */
  .draggable-container {
    width: 250px;
    height: 300px;
    position: absolute;
    z-index: 20;
    top: calc(50% - 150px);
    left: calc(50% - 125px);
  }

  .chat-bubble {
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    color: #9333ea;
    padding: 10px 16px;
    border-radius: 20px;
    font-weight: 700;
    font-family: sans-serif;
    font-size: 14px;
    box-shadow: 0px 4px 15px rgba(0,0,0,0.2);
    white-space: nowrap;
    z-index: 30;
    animation: floatBubble 4s ease-in-out infinite;
    min-width: 180px;
    text-align: center;
  }

  .chat-bubble::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 8px 8px 0;
    border-style: solid;
    border-color: white transparent transparent transparent;
  }

  /* --- GENTLE HOVER ANIMATIONS --- */
  @keyframes floatBubble {
    0%, 100% { transform: translate(-50%, 0px); }
    50% { transform: translate(-50%, -8px); }
  }

  @keyframes astronautHover {
    0%, 100% { transform: translateY(0px) rotate(-2deg); }
    50% { transform: translateY(-15px) rotate(2deg); }
  }

  /* --- STATIONARY STARS --- */
  .box-of-stars {
    width: 100%;
    height: 100%;
    position: absolute;
    z-index: 10;
    left: 0;
    top: 0;
  }

  .box-2 {
    transform: translate(300px, 200px) scale(0.8);
    opacity: 0.6;
  }

  .star {
    width: 3px; height: 3px;
    border-radius: 50%;
    background-color: #FFF;
    position: absolute;
    z-index: 10;
    opacity: 0.7;
  }

  .star:before {
    content: "";
    width: 6px; height: 6px;
    border-radius: 50%; background-color: #FFF;
    position: absolute; z-index: 10;
    top: 80px; left: 70px; opacity: .7;
  }

  .star:after {
    content: "";
    width: 8px; height: 8px;
    border-radius: 50%; background-color: #FFF;
    position: absolute; z-index: 10;
    top: 8px; left: 170px; opacity: .9;
  }

  .star-position1 { top: 30px; left: 20px; }
  .star-position2 { top: 110px; left: 250px; }
  .star-position3 { top: 60px; left: 570px; }
  .star-position4 { top: 120px; left: 900px; }
  .star-position5 { top: 20px; left: 1120px; }
  .star-position6 { top: 90px; left: 1280px; }
  .star-position7 { top: 30px; left: 1480px; }

  /* --- PIXEL ASTRONAUT STYLING --- */
  .pixel-astronaut {
    width: 150px;
    height: auto;
    position: relative;
    z-index: 11;
    margin: 0 auto;
    display: block;
    margin-top: 40px; 
    
    /* Keeps pixel art sharp and prevents blurring */
    image-rendering: pixelated; 
    
    /* Keeps the gentle hover effect */
    animation: astronautHover 6s ease-in-out infinite;
  }
`;