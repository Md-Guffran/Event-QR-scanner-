import { useState, useEffect, useCallback, useRef } from 'react';
import type { Attendee, ScanLog } from '../types';
import { databaseService } from '../services/databaseService';

const POLLING_INTERVAL = 3000; // 3 seconds

export const useAttendees = (dbUrl: string | null) => {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const attendeesRef = useRef(attendees);
  attendeesRef.current = attendees;

  useEffect(() => {
    if (!dbUrl) {
      setIsLoading(false);
      setAttendees([]);
      return;
    }

    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const initialAttendees = await databaseService.getAttendees(dbUrl);
        setAttendees(initialAttendees);
      } catch (e) {
        setError("Failed to load event data from the provided URL.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();

    const intervalId = setInterval(async () => {
      if (!dbUrl) return;
      try {
        const remoteAttendees = await databaseService.getAttendees(dbUrl);
        if (JSON.stringify(remoteAttendees) !== JSON.stringify(attendeesRef.current)) {
          setAttendees(remoteAttendees);
        }
      } catch (e) {
        console.error("Polling error:", e);
        setError("Lost connection to the database. Please check your connection.");
        clearInterval(intervalId); // Stop polling on error
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [dbUrl]);

  const addAttendee = useCallback(async (attendeeId: string, name: string): Promise<{ success: boolean; message: string }> => {
    if (!dbUrl) return { success: false, message: "Database not configured." };
    if (!attendeeId || attendeeId.trim() === '') {
        return { success: false, message: "Attendee ID cannot be empty." };
    }
    if (!name || name.trim() === '') {
        return { success: false, message: "Attendee Name cannot be empty." };
    }

    try {
      const currentRemoteAttendees = await databaseService.getAttendees(dbUrl);
      const existingIds = new Set(currentRemoteAttendees.map(a => a.id));

      if (existingIds.has(attendeeId)) {
        return { success: false, message: `Attendee with ID "${attendeeId}" already exists.` };
      }

      const newAttendee: Attendee = {
        id: attendeeId.trim(),
        name: name.trim(),
        createdAt: Date.now(),
        scans: [],
      };

      const updatedAttendees = [...currentRemoteAttendees, newAttendee];
      setAttendees(updatedAttendees); // Optimistic update
      await databaseService.saveAttendees(dbUrl, updatedAttendees);
      
      return { success: true, message: `Attendee "${name.trim()}" (${attendeeId}) added successfully.` };

    } catch (e) {
      console.error("Failed to add attendee:", e);
      setError("An error occurred while adding the attendee.");
      return { success: false, message: "An error occurred while saving." };
    }
  }, [dbUrl]);

  const addMultipleAttendees = useCallback(async (newAttendeesInfo: { id: string, name?: string }[]) => {
    if (!dbUrl) return { importedCount: 0, duplicateCount: 0 };
    try {
        const currentRemoteAttendees = await databaseService.getAttendees(dbUrl);
        const existingIds = new Set(currentRemoteAttendees.map(a => a.id));

        const attendeesToImport = newAttendeesInfo
            .filter(({ id }) => id && !existingIds.has(id))
            .map(({ id, name }): Attendee => ({
                id,
                name: name || '',
                createdAt: Date.now(),
                scans: [],
            }));
        
        if (attendeesToImport.length > 0) {
            const updatedAttendees = [...currentRemoteAttendees, ...attendeesToImport];
            setAttendees(updatedAttendees); // Optimistic update
            await databaseService.saveAttendees(dbUrl, updatedAttendees);
        }
        return {
            importedCount: attendeesToImport.length,
            duplicateCount: newAttendeesInfo.length - attendeesToImport.length
        };
    } catch (e) {
        console.error("Failed to add multiple attendees:", e);
        setError("An error occurred while importing attendees.");
        return { importedCount: 0, duplicateCount: 0 };
    }
  }, [dbUrl]);

  const getAttendeeById = useCallback((id: string) => {
    return attendees.find(a => a.id === id);
  }, [attendees]);
  
  const recordScan = useCallback(async (attendeeId: string, type: 'entrance' | 'lunch') => {
    if (!dbUrl) return;
    try {
      const currentRemoteAttendees = await databaseService.getAttendees(dbUrl);
      
      const newAttendees = currentRemoteAttendees.map(attendee => {
        if (attendee.id === attendeeId) {
          const newScan: ScanLog = { type, timestamp: Date.now() };
          const existingScans = Array.isArray(attendee.scans) ? attendee.scans : [];
          return { ...attendee, scans: [...existingScans, newScan] };
        }
        return attendee;
      });

      setAttendees(newAttendees); // Optimistic update
      await databaseService.saveAttendees(dbUrl, newAttendees);
    } catch (e) {
        console.error("Failed to record scan:", e);
        setError("Failed to save scan data. Please try again.");
    }
  }, [dbUrl]);

  return { attendees, getAttendeeById, recordScan, addAttendee, addMultipleAttendees, isLoading, error };
};