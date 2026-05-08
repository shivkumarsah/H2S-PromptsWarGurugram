import { create } from 'zustand';
import { Trip, Itinerary, ChatMessage, ChatSession, TripIntent } from '@/lib/types';
import { SAMPLE_TRIPS } from '@/lib/seed-data';

interface TravelStore {
  // State
  trips: Trip[];
  activeTrip: Trip | null;
  chatSessions: Record<string, ChatSession>;
  isGenerating: boolean;
  isChatLoading: boolean;
  onboardingStep: number;
  draftIntent: Partial<TripIntent>;
  sidebarOpen: boolean;
  mapView: boolean;

  // Actions
  setTrips: (trips: Trip[]) => void;
  setActiveTrip: (trip: Trip | null) => void;
  addTrip: (trip: Trip) => void;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  setItinerary: (tripId: string, itinerary: Itinerary) => void;
  setIsGenerating: (v: boolean) => void;
  setIsChatLoading: (v: boolean) => void;
  setOnboardingStep: (step: number) => void;
  updateDraftIntent: (updates: Partial<TripIntent>) => void;
  resetDraftIntent: () => void;
  addChatMessage: (tripId: string, message: ChatMessage) => void;
  setSidebarOpen: (v: boolean) => void;
  toggleMapView: () => void;
  loadSampleData: () => void;
}

const initialDraftIntent: Partial<TripIntent> = {
  currency: 'USD',
  groupSize: 2,
  travelStyle: [],
  interests: [],
  dietaryRestrictions: [],
  pace: 'moderate',
};

export const useTravelStore = create<TravelStore>((set, get) => ({
  trips: [],
  activeTrip: null,
  chatSessions: {},
  isGenerating: false,
  isChatLoading: false,
  onboardingStep: 0,
  draftIntent: initialDraftIntent,
  sidebarOpen: true,
  mapView: false,

  setTrips: (trips) => set({ trips }),
  
  setActiveTrip: (trip) => set({ activeTrip: trip }),
  
  addTrip: (trip) => set((state) => ({ trips: [trip, ...state.trips] })),
  
  updateTrip: (id, updates) => set((state) => ({
    trips: state.trips.map(t => t.id === id ? { ...t, ...updates } : t),
    activeTrip: state.activeTrip?.id === id ? { ...state.activeTrip, ...updates } : state.activeTrip,
  })),
  
  setItinerary: (tripId, itinerary) => set((state) => ({
    trips: state.trips.map(t => t.id === tripId ? { ...t, itinerary } : t),
    activeTrip: state.activeTrip?.id === tripId ? { ...state.activeTrip, itinerary } : state.activeTrip,
  })),
  
  setIsGenerating: (v) => set({ isGenerating: v }),
  setIsChatLoading: (v) => set({ isChatLoading: v }),
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  
  updateDraftIntent: (updates) => set((state) => ({
    draftIntent: { ...state.draftIntent, ...updates },
  })),
  
  resetDraftIntent: () => set({ draftIntent: initialDraftIntent, onboardingStep: 0 }),
  
  addChatMessage: (tripId, message) => set((state) => {
    const existing = state.chatSessions[tripId];
    const session: ChatSession = existing || {
      id: `session_${tripId}`,
      tripId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return {
      chatSessions: {
        ...state.chatSessions,
        [tripId]: {
          ...session,
          messages: [...session.messages, message],
          updatedAt: new Date().toISOString(),
        },
      },
    };
  }),
  
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  toggleMapView: () => set((state) => ({ mapView: !state.mapView })),
  
  loadSampleData: () => set({ trips: SAMPLE_TRIPS, activeTrip: SAMPLE_TRIPS[0] }),
}));
