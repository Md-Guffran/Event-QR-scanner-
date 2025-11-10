import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { Attendee } from '../types';

interface QrCodeModalProps {
  attendee: Attendee;
  onClose: () => void;
}

const QrCodeModal: React.FC<QrCodeModalProps> = ({ attendee, onClose }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    const generateQr = async () => {
      try {
        const url = await QRCode.toDataURL(attendee.id, { 
            width: 256,
            margin: 2,
            color: {
                dark:"#FFFFFF",
                light:"#111827"
            }
        });
        setQrCodeUrl(url);
      } catch (err) {
        console.error('Failed to generate QR code', err);
      }
    };
    generateQr();
  }, [attendee.id]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 text-center max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-2">{attendee.name || 'Attendee'}</h2>
        <p className="text-lg font-mono text-gray-400 mb-6">{attendee.id}</p>
        <div className="bg-gray-900 p-4 rounded-lg inline-block">
            {qrCodeUrl ? (
                <img src={qrCodeUrl} alt={`QR Code for ${attendee.id}`} />
            ) : (
                <p>Generating QR Code...</p>
            )}
        </div>
        <p className="text-xs text-gray-500 mt-4">Scan this for entrance & lunch.</p>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default QrCodeModal;