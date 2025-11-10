import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import type { Attendee } from '../types';
import { LoginIcon, FoodIcon, CheckCircleIcon, XCircleIcon, ShieldExclamationIcon } from './icons';

interface ScannerProps {
  getAttendeeById: (id: string) => Attendee | undefined;
  recordScan: (attendeeId: string, type: 'entrance' | 'lunch') => void;
}

type ScanStatus = 'success' | 'error' | 'info';

const qrcodeRegionId = "qr-code-reader";

const Scanner: React.FC<ScannerProps> = ({ getAttendeeById, recordScan }) => {
  const [scannedAttendee, setScannedAttendee] = useState<Attendee | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string, type: ScanStatus } | null>(null);
  
  const todayStr = new Date().toDateString();
  const hasHadLunchToday = scannedAttendee?.scans.some(
      scan => scan.type === 'lunch' && new Date(scan.timestamp).toDateString() === todayStr
  ) || false;

  const handleScanSuccess = (decodedText: string) => {
    if (isPaused) return;

    setIsPaused(true);
    const attendee = getAttendeeById(decodedText);
    if (attendee) {
      setScannedAttendee(attendee);
      setErrorMessage('');
    } else {
      setScannedAttendee(null);
      setErrorMessage(`Attendee not found. QR data: ${decodedText}`);
      setStatusMessage({ text: 'Attendee not found.', type: 'error' });
      setTimeout(() => {
        setStatusMessage(null);
        setIsPaused(false);
      }, 2000);
    }
  };
  
  // Using a ref to avoid stale closures in the scanner callback
  const handleScanSuccessRef = useRef(handleScanSuccess);
  handleScanSuccessRef.current = handleScanSuccess;
  
  useEffect(() => {
    let scanner: Html5Qrcode | null = new Html5Qrcode(qrcodeRegionId);

    const startScanner = async () => {
      if (!scanner) return;
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
                const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                const qrboxSize = Math.floor(minEdge * 0.8);
                return { width: qrboxSize, height: qrboxSize };
            },
            aspectRatio: 1.0,
          },
          (decodedText, decodedResult) => {
            handleScanSuccessRef.current(decodedText);
          },
          (errorMessage) => {
            // This callback is called when a QR code is not found. We can ignore it.
          }
        );
      } catch (err) {
        console.error("Failed to start scanner", err);
        setErrorMessage("Could not start camera. Please grant permission and refresh.");
      }
    };
    
    startScanner();
    
    return () => {
      if (scanner) {
        scanner.stop().catch(err => {
          console.error("Failed to stop scanner", err);
        });
      }
      scanner = null;
    };
  }, []);

  const handleScanAction = (type: 'entrance' | 'lunch') => {
    if (!scannedAttendee) return;
    recordScan(scannedAttendee.id, type);
    const successText = type === 'entrance' ? 'Check-in successful!' : 'Lunch redeemed!';
    setStatusMessage({ text: successText, type: 'success' });
    resetScanner();
  };

  const resetScanner = () => {
    setTimeout(() => {
        setScannedAttendee(null);
        setErrorMessage('');
        setIsPaused(false);
        setStatusMessage(null);
    }, 1500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center space-y-4">
      <h2 className="text-3xl font-bold tracking-tight text-white">QR Code Scanner</h2>
      <div className="w-full aspect-square bg-gray-800 rounded-lg shadow-lg overflow-hidden relative">
        <div id={qrcodeRegionId} />
         <div className="absolute inset-0 border-8 border-white/20 rounded-lg pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border-4 border-indigo-500 rounded-md"></div>
        </div>
      </div>
      
      {statusMessage && (
        <div className={`w-full p-4 rounded-lg flex items-center justify-center gap-2 text-white font-semibold ${
          statusMessage.type === 'success' ? 'bg-green-500' : statusMessage.type === 'error' ? 'bg-red-500' : 'bg-yellow-500'
        }`}>
          {statusMessage.type === 'success' && <CheckCircleIcon />}
          {statusMessage.type === 'error' && <XCircleIcon />}
          {statusMessage.type === 'info' && <ShieldExclamationIcon />}
          {statusMessage.text}
        </div>
      )}

      {scannedAttendee && (
        <div className="w-full bg-gray-800 p-6 rounded-lg shadow-lg text-center animate-fade-in">
          <h3 className="text-2xl font-bold">{scannedAttendee.name || 'Unknown Attendee'}</h3>
          <p className="font-mono text-gray-400 text-sm mt-1">{scannedAttendee.id}</p>
          {hasHadLunchToday && (
            <p className="mt-2 text-yellow-400 font-semibold flex items-center justify-center gap-2">
                <ShieldExclamationIcon /> Lunch already redeemed for today
            </p>
          )}
          <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleScanAction('entrance')}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              <LoginIcon /> Entrance Check-in
            </button>
            <button
              onClick={() => handleScanAction('lunch')}
              disabled={hasHadLunchToday}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              <FoodIcon /> Redeem Lunch
            </button>
          </div>
           <button onClick={resetScanner} className="mt-4 text-sm text-gray-400 hover:text-white">Cancel & Scan Next</button>
        </div>
      )}

      {(errorMessage && !scannedAttendee) && (
        <div className="w-full bg-red-800 p-4 rounded-lg text-center">
          <p className="font-semibold text-white">{errorMessage}</p>
        </div>
      )}

       {!scannedAttendee && !statusMessage && !errorMessage && (
         <p className="text-gray-400">Point the camera at a QR code to begin.</p>
       )}
    </div>
  );
};

export default Scanner;