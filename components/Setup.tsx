import React, { useState } from 'react';
import { databaseService } from '../services/databaseService';
import { CheckCircleIcon, XCircleIcon } from './icons';

interface SetupProps {
  onSave: (url: string) => void;
}

const Setup: React.FC<SetupProps> = ({ onSave }) => {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    const handleTestAndSave = async () => {
        setIsLoading(true);
        setStatus(null);

        if (!url.startsWith('https://api.npoint.io/')) {
            setStatus({ message: 'Invalid URL. Please paste a valid URL from npoint.io.', type: 'error'});
            setIsLoading(false);
            return;
        }
        
        const result = await databaseService.testEndpoint(url);
        if (result.success) {
            setStatus({ message: 'Connection successful! Starting app...', type: 'success'});
            setTimeout(() => onSave(url), 1500);
        } else {
            setStatus({ message: result.message, type: 'error'});
            setIsLoading(false);
        }
    }
    
    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-gray-800 rounded-lg shadow-xl p-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-white text-center">Welcome!</h1>
                    <p className="text-gray-400 text-center mt-2">Let's set up your private database to sync across devices.</p>
                </div>

                <div className="bg-gray-900 p-6 rounded-lg space-y-4">
                    <h2 className="text-xl font-semibold text-indigo-400">Instructions (1-Minute Setup)</h2>
                    <ol className="list-decimal list-inside text-gray-300 space-y-2 text-sm">
                        <li>
                            Open a new browser tab and go to <a href="https://www.npoint.io/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-semibold">npoint.io</a>.
                        </li>
                        <li>
                            You will see a text editor. Delete any existing text and enter only: <code className="bg-gray-700 p-1 rounded-md text-white font-mono">[]</code>
                        </li>
                        <li>
                            Click the green <span className="font-semibold">"Create"</span> button.
                        </li>
                        <li>
                            Copy the generated URL (it will look like <code className="bg-gray-700 p-1 rounded-md text-white font-mono text-xs">https://api.npoint.io/your-unique-id</code>).
                        </li>
                        <li>
                            Paste that URL in the field below and click "Save & Continue".
                        </li>
                    </ol>
                </div>
                
                <div className="space-y-4">
                     <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://api.npoint.io/..."
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label="Database URL"
                     />
                     <button
                        onClick={handleTestAndSave}
                        disabled={isLoading || !url}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                     >
                        {isLoading ? (
                             <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Testing...
                            </>
                        ) : "Save & Continue"}
                     </button>
                </div>

                {status && (
                    <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-semibold text-white ${status.type === 'success' ? 'bg-green-500/80' : 'bg-red-500/80'}`}>
                       {status.type === 'success' ? <CheckCircleIcon /> : <XCircleIcon />}
                       {status.message}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Setup;