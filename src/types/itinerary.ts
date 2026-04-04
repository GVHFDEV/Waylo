/**
 * WAYLO ITINERARY TYPES (V3.0)
 * Rigorous typing for the W.A.Y.L.O. Engine output.
 */

export type Period = 'Manhã' | 'Tarde' | 'Noite';
export type FatigueLevel = 'low' | 'medium' | 'high';

export interface TripSummary {
  destination: string;
  total_days: number;
  dominant_vibe: string;
  important_notes: string | null;
}

export interface Hotel {
  name: string;
  neighborhood: string;
  reason: string;
  price_per_night: string;
}

export interface Activity {
  type: 'activity';
  period: Period;
  description: string;
  place_name: string;
  estimated_cost: string;
}

export interface Tip {
  type: 'tip';
  content: string;
}

export type ItineraryItem = Activity | Tip;

export interface ItineraryDay {
  day: number;
  day_title: string;
  anchor: string;
  fatigue_level: FatigueLevel;
  items: ItineraryItem[];
}

export interface ItineraryResponse {
  trip_summary: TripSummary;
  hotels: Hotel[];
  itinerary: ItineraryDay[];
}
