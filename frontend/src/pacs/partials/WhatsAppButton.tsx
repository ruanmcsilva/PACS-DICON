import React, { useState, useRef, useEffect } from 'react';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phoneNumber = '5582987654321', // Substitua pelo número da sua empresa (DDI + DDD + Número)
  message = 'Olá! Gostaria de mais informações sobre o PACS Cloud.',
}) => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  
  const dragInfo = useRef({
    isPointerDown: false,
    startX: 0,
    startY: 0,
    initialLeft: 0,
    initialTop: 0,
    hasMoved: false,
  });

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  const handlePointerDown = (clientX: number, clientY: number) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();

    dragInfo.current = {
      isPointerDown: true,
      startX: clientX,
      startY: clientY,
      initialLeft: rect.left,
      initialTop: rect.top,
      hasMoved: false,
    };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!dragInfo.current.isPointerDown) return;

    const deltaX = clientX - dragInfo.current.startX;
    const deltaY = clientY - dragInfo.current.startY;

    // Se moveu mais de 5px, ativa o modo de arrasto
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      if (!dragInfo.current.hasMoved) {
        dragInfo.current.hasMoved = true;
        setIsDragging(true);
      }

      const btnSize = 60;
      // Garante que o botão não saia para fora dos limites da janela
      const newX = Math.max(12, Math.min(window.innerWidth - btnSize - 12, dragInfo.current.initialLeft + deltaX));
      const newY = Math.max(12, Math.min(window.innerHeight - btnSize - 12, dragInfo.current.initialTop + deltaY));

      setPosition({ x: newX, y: newY });
    }
  };

  const handlePointerUp = () => {
    if (!dragInfo.current.isPointerDown) return;

    const didMove = dragInfo.current.hasMoved;
    dragInfo.current.isPointerDown = false;
    setIsDragging(false);

    // Se foi apenas um clique (sem arrastar), abre a conversa no WhatsApp
    if (!didMove) {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onMouseUp = () => handlePointerUp();
    
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => handlePointerUp();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [whatsappUrl]);

  return (
    <div
      ref={buttonRef}
      className={`whatsapp-float-btn ${isDragging ? 'dragging' : ''}`}
      style={
        position
          ? { left: `${position.x}px`, top: `${position.y}px`, right: 'auto', bottom: 'auto' }
          : { left: '28px', bottom: '28px' }
      }
      onMouseDown={(e) => {
        // Previne seleção indesejada de texto durante o arrasto
        e.preventDefault();
        handlePointerDown(e.clientX, e.clientY);
      }}
      onTouchStart={(e) => {
        if (e.touches.length > 0) {
          handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Fale conosco pelo WhatsApp"
    >
      {/* Balão com texto que esconde enquanto arrasta */}
      {!isDragging && (
        <span className="whatsapp-tooltip">
          Fale Conosco
        </span>
      )}

      {/* Ícone com animação de pulso */}
      <div className="whatsapp-icon-box">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.09-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.49-.4-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.22.25-.86.84-.86 2.06 0 1.21.89 2.39 1.01 2.55.12.17 1.74 2.66 4.22 3.73.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.18-.47-.3Z" />
        </svg>
      </div>
    </div>
  );
};

export default WhatsAppButton;
