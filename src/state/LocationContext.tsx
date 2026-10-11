import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { strings } from '../i18n/strings';

// v2 namespace: the v1 keys still hold the fabricated Karrada/Al-Mansour seed on
// any install that ran the old build and saved or starred an address. Reading a
// fresh key drops those rows for good rather than hydrating them back blank.
const STORAGE_KEY = '@hail/locations.v2';
const SELECTED_KEY = '@hail/location-selected.v2';

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

// A pin saved without a typed name used to store the translated "Pinned
// location" literal of whatever language was active at save time, so the label
// stayed frozen in that language even after a switch. An empty label — and any
// stored copy of that literal in either language — is treated as unnamed and
// resolved through t() at render, so it always follows the current language.
const PINNED_LITERALS = new Set((['ar', 'en'] as const).map((l) => strings[l]['location.pinned']));

export const locationLabel = (
  location: Pick<SavedLocation, 'label'>,
  t: (key: string) => string,
): string => {
  const label = location.label?.trim();
  return label && !PINNED_LITERALS.has(label) ? label : t('location.pinned');
};

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const { status } = useAuth();
  const prevStatus = useRef(status);

  useEffect(() => {
    let active = true;
    (async () => {
      // Unreadable or corrupt storage is the same as none: without the catch a
      // bad row left `hydrated` false for good, and every screen that waits on
      // it showed nothing at all instead of the empty state.
      try {
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
      } catch {
        // Fall through to the empty, hydrated state.
      }
      if (active) setHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Sign-out removes the stored addresses (AuthContext), but the list already in
  // memory would still be offered to whoever signs in next. Only the authed →
  // guest edge clears it: a launch straight into guest has nothing to drop, and
  // clearing there could race the read above.
  useEffect(() => {
    if (prevStatus.current === 'authed' && status === 'guest') {
      setLocations([]);
      setSelectedId(null);
    }
    prevStatus.current = status;
  }, [status]);

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
