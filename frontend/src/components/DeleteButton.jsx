import React, { useState } from 'react';

/**
 * A reusable delete button that uses an in-place confirmation UI
 * instead of the unreliable browser confirm() dialog.
 */
export default function DeleteButton({ onDelete, label = 'Del', className = 'btn-ghost' }) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    setIsConfirming(true);
  };

  const handleConfirm = (e) => {
    e.stopPropagation();
    onDelete();
    setIsConfirming(false);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setIsConfirming(false);
  };

  if (isConfirming) {
    return (
      <div 
        style={{ 
          display: 'inline-flex', 
          gap: '4px', 
          alignItems: 'center', 
          background: 'var(--red)', 
          borderRadius: '4px', 
          padding: '2px 4px',
          animation: 'pulse 1.5s infinite'
        }}
        onClick={e => e.stopPropagation()}
      >
        <span style={{ fontSize: '9px', color: 'white', fontWeight: '800', marginRight: '2px', paddingLeft: '4px' }}>SURE?</span>
        <button 
          onClick={handleConfirm} 
          style={{ 
            background: 'white', 
            color: 'var(--red)', 
            border: 'none', 
            borderRadius: '3px', 
            padding: '2px 8px', 
            fontSize: '9px', 
            fontWeight: '900', 
            cursor: 'pointer' 
          }}
        >
          YES
        </button>
        <button 
          onClick={handleCancel} 
          style={{ 
            background: 'transparent', 
            color: 'white', 
            border: '1px solid white', 
            borderRadius: '3px', 
            padding: '2px 8px', 
            fontSize: '9px', 
            fontWeight: '900', 
            cursor: 'pointer' 
          }}
        >
          NO
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleClick} 
      className={`btn ${className}`} 
      style={{ 
        padding: '2px 6px', 
        fontSize: '9px', 
        opacity: 0.8, 
        color: className.includes('danger') ? 'white' : 'var(--red)',
        border: '1px solid rgba(255, 71, 87, 0.2)'
      }}
    >
      {label}
    </button>
  );
}
