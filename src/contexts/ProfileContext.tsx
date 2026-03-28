/**
 * Profile Context
 * Manages multi-profile state for the menstrual tracking system
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { profileOps } from '@/lib/menstrual-storage';
import { MENSTRUAL_DATA_UPDATED } from '@/lib/menstrual-storage';
import type { Profile, ProfileSettings } from '@/types/menstrual';

interface ProfileContextType {
  currentProfile: Profile | null;
  allProfiles: Profile[];
  isLoading: boolean;
  switchProfile: (id: string) => Promise<void>;
  createProfile: (name: string, color: string, settings?: Partial<ProfileSettings>) => Promise<Profile>;
  updateProfile: (id: string, updates: Partial<Profile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfiles = useCallback(async () => {
    try {
      const [defaultProfile, profiles] = await Promise.all([
        profileOps.getDefault(),
        profileOps.getAll(),
      ]);
      setCurrentProfile(defaultProfile);
      setAllProfiles(profiles);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();

    const handleUpdate = () => loadProfiles();
    window.addEventListener(MENSTRUAL_DATA_UPDATED, handleUpdate);
    return () => window.removeEventListener(MENSTRUAL_DATA_UPDATED, handleUpdate);
  }, [loadProfiles]);

  const switchProfile = useCallback(async (id: string) => {
    await profileOps.setDefault(id);
    const profile = await profileOps.getById(id);
    if (profile) {
      setCurrentProfile(profile);
      window.dispatchEvent(new CustomEvent('profile-switched', { detail: { profileId: id } }));
    }
    await loadProfiles();
  }, [loadProfiles]);

  const createProfile = useCallback(async (name: string, color: string, settings?: Partial<ProfileSettings>) => {
    const profile = await profileOps.create(name, color, settings);
    await loadProfiles();
    return profile;
  }, [loadProfiles]);

  const updateProfile = useCallback(async (id: string, updates: Partial<Profile>) => {
    await profileOps.update(id, updates);
    await loadProfiles();
  }, [loadProfiles]);

  const deleteProfile = useCallback(async (id: string) => {
    if (allProfiles.length <= 1) {
      throw new Error('Cannot delete the last profile');
    }
    await profileOps.delete(id);
    // If we deleted the current profile, switch to another
    if (currentProfile?.id === id) {
      const remaining = allProfiles.filter(p => p.id !== id);
      if (remaining.length > 0) {
        await switchProfile(remaining[0].id);
      }
    }
    await loadProfiles();
  }, [allProfiles, currentProfile, loadProfiles, switchProfile]);

  return (
    <ProfileContext.Provider
      value={{
        currentProfile,
        allProfiles,
        isLoading,
        switchProfile,
        createProfile,
        updateProfile,
        deleteProfile,
        reload: loadProfiles,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfileContext() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  return context;
}

export default ProfileContext;
