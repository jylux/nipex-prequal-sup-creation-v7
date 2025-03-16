// backend/src/utils/addressParser.ts

import axios from 'axios';

/**
 * Parse the given address using the OpenStreetMap (Nominatim) API.
 * Extracts the town/city component from the result.
 *
 * @param address The full address string to parse.
 * @returns The town/city name, or "Unknown" if not found.
 */
export async function parseAddress(address: string): Promise<string> {
  if (!address || typeof address !== 'string') {
    return 'Unknown';
  }

  try {
    // Add user-agent header to comply with Nominatim usage policy
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const { data } = await axios.get(url, { 
      headers: { 'User-Agent': 'NipexJQS/1.0' },
      timeout: 5000 
    });

    if (data && data.length > 0) {
      // Extract town or city from display_name
      const parts = data[0].display_name.split(', ');
      
      // Try to identify the town/city part - typically one of the first few parts
      // This is a simple approach and might need refinement based on your data
      if (parts.length >= 2) {
        return parts[1]; // Often the second component is the town/city
      } else if (parts.length === 1) {
        return parts[0];
      }
    }
    
    return 'Unknown';
  } catch (err) {
    console.error('Address parsing error:', err);
    return 'Unknown';
  }
}