import React, { useRef, useEffect } from 'react';
import QRCode from 'qrcode';

interface RealQRCodeProps {
  url: string;
}

const RealQRCode: React.FC<RealQRCodeProps> = ({ url }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && url) {
      QRCode.toCanvas(canvas, url, {
        width: 120,
        margin: 1,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000', // QR code color
          light: '#FFFFFF', // Background color
        }
      }, (error) => {
        if (error) console.error('Error generating QR Code:', error);
      });
    }
  }, [url]);

  return <canvas ref={canvasRef} />;
};

export default RealQRCode;