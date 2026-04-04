import { z } from 'zod';

/**
 * WAYLO ITINERARY SCHEMA (V3.0)
 * Runtime validation using Zod to ensure the W.A.Y.L.O. engine
 * strictly follows the defined contracts.
 */

export const PeriodSchema = z.enum(['Manhã', 'Tarde', 'Noite']);
export const FatigueLevelSchema = z.enum(['low', 'medium', 'high']);

export const TripSummarySchema = z.object({
  destination: z.string().min(1),
  total_days: z.number().int().positive(),
  dominant_vibe: z.string(),
  important_notes: z.string().nullable().optional(),
});

export const HotelSchema = z.object({
  name: z.string().min(1),
  neighborhood: z.string(),
  reason: z.string(),
  price_per_night: z.string(),
});

export const ActivitySchema = z.object({
  type: z.literal('activity'),
  period: PeriodSchema,
  description: z.string().min(10),
  place_name: z.string().min(1),
  estimated_cost: z.string(),
});

export const TipSchema = z.object({
  type: z.literal('tip'),
  content: z.string().min(5),
});

export const ItineraryItemSchema = z.discriminatedUnion('type', [
  ActivitySchema,
  TipSchema,
]);

export const ItineraryDaySchema = z.object({
  day: z.number().int().positive(),
  day_title: z.string(),
  anchor: z.string(),
  fatigue_level: FatigueLevelSchema,
  items: z.array(ItineraryItemSchema),
});

export const ItineraryResponseSchema = z.object({
  trip_summary: TripSummarySchema,
  hotels: z.array(HotelSchema),
  itinerary: z.array(ItineraryDaySchema),
});

export type ItineraryResponse = z.infer<typeof ItineraryResponseSchema>;
