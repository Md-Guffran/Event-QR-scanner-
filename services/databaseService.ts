import type { Attendee } from '../types';

export const databaseService = {
  /**
   * Fetches the full list of attendees from the provided cloud store URL.
   */
  async getAttendees(url: string): Promise<Attendee[]> {
    if (!url) throw new Error("Database URL is not configured.");
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Failed to fetch attendees:", error);
      throw error;
    }
  },

  /**
   * Saves the full list of attendees to the provided cloud store URL.
   */
  async saveAttendees(url: string, attendees: Attendee[]): Promise<void> {
    if (!url) throw new Error("Database URL is not configured.");
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendees),
      });
      if (!response.ok) {
        throw new Error(`Failed to save attendees: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Failed to save attendees:", error);
      throw error;
    }
  },

  /**
   * Tests a given URL to see if it's a valid and reachable endpoint.
   */
  async testEndpoint(url: string): Promise<{ success: boolean; message: string; }> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            return { success: false, message: `The server responded with status ${response.status}. Please check the URL.` };
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
            return { success: false, message: 'Endpoint is valid, but the content is not an empty JSON array `[]`.' };
        }
        return { success: true, message: 'Connection successful!' };
    } catch (e) {
        if (e instanceof TypeError) {
            return { success: false, message: 'Failed to connect. This might be a CORS issue or an invalid URL.' };
        }
        return { success: false, message: 'The endpoint does not contain valid JSON.' };
    }
  }
};