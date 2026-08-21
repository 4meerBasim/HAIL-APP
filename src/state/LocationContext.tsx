import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@jareesh/locations';
const SELECTED_KEY = '@jareesh/location-selected';

export interface SavedLocation {
  id: string;
  // Seeded entries carry a key so they follow the language; ones the customer
  // names on the map carry the literal they typed.
  labelKey?: string;
  label?: string;
  address: string;
  lat: number;
  lng: number;
  favourite: boolean;
}

// Karrada and Al-Mansour, matching the addresses the cart and profile already
// show. Coordinates are the district centres.
const SEEDED: SavedLocation[] = [
  {
    id: 'home',
    labelKey: 'location.home',
    address: 'بغداد، الكرادة، شارع 62',
    lat: 33.2986,
    lng: 44.4297,
    favourite: true,
  },
  {
    id: 'work',
    labelKey: 'location.work',
    address: 'بغداد، المنصور',
    lat: 33.3128,
    lng: 44.3277,
    favourite: false,
  },
];

export interface LocationContextValue {
  locations: SavedLocation[];
  selected: SavedLocation;
  selectLocation: (id: string) => void;
  saveLocation: (loc: Omit<SavedLocation, 'id'>) => SavedLocation;
  toggleFavourite: (id: string) => void;
  removeLocation: (id: string) => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [locations, setLocations] = useState<SavedLocation[]>(SEEDED);
  const [selectedId, setSelectedId] = useState<string>(SEEDED[0].id);

  useEffect(() => {
    let active = true;
    (async () => {
      const [rawList, rawSelected] = await AsyncStorage.multiGet([STORAGE_KEY, SELECTED_KEY]);
      if (!active) return;
      const stored = rawList[1] ? (JSON.parse(rawList[1]) as SavedLocation[]) : null;
      if (stored?.length) {
        setLocations(stored);
        // A stale pointer would leave `selected` falling back to the first row
        // on every launch, silently discarding the customer's choice.
        const id = rawSelected[1];
        setSelectedId(id && stored.some((l) => l.id === id) ? id : stored[0].id);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((next: SavedLocation[]) => {
    setLocations(next);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const selectLocation = useCallback((id: string) => {
    setSelectedId(id);
    void AsyncStorage.setItem(SELECTED_KEY, id);
  }, []);

  const saveLocation = useCallback(
    (loc: Omit<SavedLocation, 'id'>): SavedLocation => {
      const created: SavedLocation = { ...loc, id: `loc-${Date.now()}` };
      setLocations((prev) => {
        const next = [...prev, created];
        void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      return created;
    },
    [],
  );

  const toggleFavourite = useCallback(
    (id: string) => {
      persist(locations.map((l) => (l.id === id ? { ...l, favourite: !l.favourite } : l)));
    },
    [locations, persist],
  );

  const removeLocation = useCallback(
    (id: string) => {
      const next = locations.filter((l) => l.id !== id);
      if (!next.length) return;
      persist(next);
      if (id === selectedId) selectLocation(next[0].id);
    },
    [locations, persist, selectedId, selectLocation],
  );

  const value = useMemo<LocationContextValue>(() => {
    // Favourites first, insertion order within each group.
    const ordered = [...locations].sort((a, b) => Number(b.favourite) - Number(a.favourite));
    return {
      locations: ordered,
      selected: locations.find((l) => l.id === selectedId) ?? locations[0],
      selectLocation,
      saveLocation,
      toggleFavourite,
      removeLocation,
    };
  }, [locations, selectedId, selectLocation, saveLocation, toggleFavourite, removeLocation]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocations(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocations must be used within a LocationProvider');
  }
  return ctx;
}
