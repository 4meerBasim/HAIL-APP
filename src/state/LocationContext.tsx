import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// v2 namespace: the v1 keys still hold the fabricated Karrada/Al-Mansour seed on
// any install that ran the old build and saved or starred an address. Reading a
// fresh key drops those rows for good rather than hydrating them back blank.
const STORAGE_KEY = '@jareesh/locations.v2';
const SELECTED_KEY = '@jareesh/location-selected.v2';

export interface SavedLocation {
  id: string;
  // The name the customer typed for this pin on the map.
  label?: string;
  address: string;
  lat: number;
  lng: number;
  favourite: boolean;
}

export interface LocationContextValue {
  locations: SavedLocation[];
  // Null until the customer saves their first delivery address.
  selected: SavedLocation | null;
  /** False until stored addresses have been read back — lets a screen tell
   *  "no address yet" apart from "not loaded yet". */
  hydrated: boolean;
  selectLocation: (id: string) => void;
  saveLocation: (loc: Omit<SavedLocation, 'id'>) => SavedLocation;
  toggleFavourite: (id: string) => void;
  removeLocation: (id: string) => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

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
      setHydrated(true);
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
      persist(next);
      // Deleting the selected address moves the pointer to whatever remains, or
      // clears it entirely once the last one is gone.
      if (id === selectedId) {
        if (next.length) selectLocation(next[0].id);
        else {
          setSelectedId(null);
          void AsyncStorage.removeItem(SELECTED_KEY);
        }
      }
    },
    [locations, persist, selectedId, selectLocation],
  );

  const value = useMemo<LocationContextValue>(() => {
    // Favourites first, insertion order within each group.
    const ordered = [...locations].sort((a, b) => Number(b.favourite) - Number(a.favourite));
    return {
      locations: ordered,
      selected: locations.find((l) => l.id === selectedId) ?? locations[0] ?? null,
      hydrated,
      selectLocation,
      saveLocation,
      toggleFavourite,
      removeLocation,
    };
  }, [locations, selectedId, hydrated, selectLocation, saveLocation, toggleFavourite, removeLocation]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocations(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocations must be used within a LocationProvider');
  }
  return ctx;
}
