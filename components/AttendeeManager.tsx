import React, { useState, useRef } from 'react';
import type { Attendee } from '../types';
import QrCodeModal from './QrCodeModal';
import { QrCodeIcon, UploadIcon, DownloadIcon, UserGroupIcon, UserPlusIcon } from './icons';

interface AttendeeManagerProps {
  attendees: Attendee[];
  addAttendee: (id: string, name: string) => Promise<{ success: boolean; message: string }>;
  addMultipleAttendees: (attendees: { id: string; name?: string }[]) => Promise<{ importedCount: number; duplicateCount: number }>;
}

const AttendeeManager: React.FC<AttendeeManagerProps> = ({ attendees, addAttendee, addMultipleAttendees }) => {
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [importStatus, setImportStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newAttendeeId, setNewAttendeeId] = useState('');
  const [newAttendeeName, setNewAttendeeName] = useState('');
  const [addStatus, setAddStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const handleExport = () => {
    const header = ['id', 'name'];
    const csvRows = [
      header.join(','),
      ...attendees.map(att => `"${att.id}","${att.name || ''}"`)
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8,' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'event-attendees.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      try {
        const lines = text.trim().split(/\r?\n/);
        if (lines.length < 2) {
            throw new Error("CSV file must have a header and at least one data row.");
        }
        
        const headerLine = lines[0].trim().toLowerCase().replace(/"/g, '');
        const headers = headerLine.split(',').map(h => h.trim());
        const idIndex = headers.indexOf('id');
        const nameIndex = headers.indexOf('name');
        
        if (idIndex === -1) {
          throw new Error("CSV header must contain 'id'.");
        }

        const parsedAttendees = lines.slice(1).map(line => {
          // This is a simple parser; it won't handle commas within quoted fields.
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const id = values[idIndex];
          const name = nameIndex !== -1 ? values[nameIndex] : '';
          return { id, name };
        }).filter(a => a.id);
        
        if (parsedAttendees.length === 0) {
            throw new Error("No valid attendee IDs found in the file to import.");
        }
        
        const { importedCount, duplicateCount } = await addMultipleAttendees(parsedAttendees);

        let message = `Successfully imported ${importedCount} new attendees.`;
        if (duplicateCount > 0) {
            message += ` ${duplicateCount} duplicate(s) were skipped.`;
        }
        if (importedCount === 0 && duplicateCount > 0) {
            message = `Import finished. No new attendees added as all ${duplicateCount} record(s) were duplicates.`
        }

        setImportStatus({ message, type: 'success' });
        
      } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred during import.";
        setImportStatus({ message, type: 'error' });
      } finally {
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setIsImporting(false);
        setTimeout(() => setImportStatus(null), 8000);
      }
    };
    reader.readAsText(file);
  };

  const handleAddAttendee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttendeeId.trim() || !newAttendeeName.trim()) return;

    setIsAdding(true);
    setAddStatus(null);
    
    const result = await addAttendee(newAttendeeId, newAttendeeName);
    
    setAddStatus({ message: result.message, type: result.success ? 'success' : 'error' });
    
    if (result.success) {
      setNewAttendeeId('');
      setNewAttendeeName('');
    }

    setIsAdding(false);
    setTimeout(() => setAddStatus(null), 5000);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-8">
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-700">
            <div>
                 <h2 className="text-2xl font-bold flex items-center gap-2"><UserGroupIcon /> Attendee List ({attendees.length})</h2>
                 <p className="text-sm text-gray-400 mt-1">Manage event attendees via CSV or manual entry.</p>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv"
                    className="hidden"
                    disabled={isImporting}
                />
                <button
                    onClick={triggerFileUpload}
                    disabled={isImporting}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm disabled:bg-gray-500 disabled:cursor-wait"
                >
                    {isImporting ? "Importing..." : <><UploadIcon /> Import</>}
                </button>
                <button
                    onClick={handleExport}
                    disabled={attendees.length === 0}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                    <DownloadIcon /> Export
                </button>
            </div>
        </div>
        
        {importStatus && (
            <div className={`p-4 text-sm font-medium ${importStatus.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                {importStatus.message}
            </div>
        )}
        
        <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">Add Attendee Manually</h3>
            <form onSubmit={handleAddAttendee} className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    value={newAttendeeId}
                    onChange={(e) => setNewAttendeeId(e.target.value)}
                    placeholder="Enter Ticket ID"
                    className="w-full sm:w-1/3 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isAdding}
                />
                <input
                    type="text"
                    value={newAttendeeName}
                    onChange={(e) => setNewAttendeeName(e.target.value)}
                    placeholder="Enter Attendee Name"
                    className="flex-grow px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isAdding}
                />
                <button 
                    type="submit" 
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-indigo-400 disabled:cursor-wait"
                    disabled={isAdding || !newAttendeeId.trim() || !newAttendeeName.trim()}
                >
                    {isAdding ? 'Adding...' : <><UserPlusIcon /> Add</>}
                </button>
            </form>
            {addStatus && (
                <div className={`mt-3 p-2 text-sm rounded-md font-medium ${addStatus.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                    {addStatus.message}
                </div>
            )}
        </div>

        <div className="p-6 border-b border-gray-700 bg-gray-900/50">
            <p className="text-xs text-gray-400">
                <span className="font-semibold">Import Instructions:</span> Your CSV file must contain an <code className="bg-gray-700 p-1 rounded">id</code> column. An optional <code className="bg-gray-700 p-1 rounded">name</code> column can also be included.
            </p>
        </div>

        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ticket ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {attendees.map((attendee) => (
                        <tr key={attendee.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{attendee.name || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-400">{attendee.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                    onClick={() => setSelectedAttendee(attendee)}
                                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                                >
                                    <QrCodeIcon /> View QR
                                </button>
                            </td>
                        </tr>
                    ))}
                     {attendees.length === 0 && (
                        <tr>
                            <td colSpan={3} className="text-center py-10 text-gray-400">No attendees yet. Add one manually or import a CSV file.</td>
                        </tr>
                     )}
                </tbody>
            </table>
        </div>
      </div>
      
      {selectedAttendee && (
        <QrCodeModal attendee={selectedAttendee} onClose={() => setSelectedAttendee(null)} />
      )}
    </div>
  );
};

export default AttendeeManager;