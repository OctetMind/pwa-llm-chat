import React from 'react';

interface WIPOverlayProps {
  message?: string;
}

const WIPOverlay: React.FC<WIPOverlayProps> = ({ message = 'Work In Progress - This page is currently under development.' }) => {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      textAlign: 'center',
      fontSize: '2em',
      fontWeight: 'bold',
      color: '#333',
      pointerEvents: 'auto', // Prevent clicks from passing through
    }}>
      <p>{message}</p>
    </div>
  );
};

export default WIPOverlay;