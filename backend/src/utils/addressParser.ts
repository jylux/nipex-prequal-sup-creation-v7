// backend/src/utils/addressParser.ts

import axios from 'axios';

/**
 * Parse the given address using the OpenStreetMap (Nominatim) API.
 *
 * @param address The full address string to parse.
 * @returns A string (city/area name), or "Unknown" if not found.
 */
export async function parseAddress(address: string): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address
    )}`;
    const { data } = await axios.get(url, { timeout: 5000 });

    if (data && data.length > 0) {
      const { display_name } = data[0];
      // Return display_name or extract city/town from the data as needed
      return display_name;
    }
  } catch (err) {
    console.error('Address parsing error:', err);
  }

  // Default/fallback if the API call fails or returns no results
  return 'Unknown';
}
