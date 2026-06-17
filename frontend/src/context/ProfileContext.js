import React, { createContext, useContext, useState, useCallback } from 'react';
import { profileAPI } from '../utils/api';

const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 1 / KG_TO_LBS;
const CM_TO_IN = 0.393701;

const ProfileContext = createContext({});

export const ProfileProvider = ({ children }) => {
  const [displayName, setDisplayName] = useState('');
  const [avatarLetter, setAvatarLetter] = useState('');
  const [unitPreference, setUnitPreference] = useState('metric');
  const [aiPersona, setAiPersona] = useState('friendly');
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const isImperial = unitPreference === 'imperial';
  const weightUnit = isImperial ? 'lbs' : 'kg';

  const formatWeight = useCallback((valueInKg) => {
    if (valueInKg == null) return { value: null, unit: weightUnit };
    const converted = isImperial ? +(valueInKg * KG_TO_LBS).toFixed(1) : +Number(valueInKg).toFixed(1);
    return { value: converted, unit: weightUnit };
  }, [isImperial, weightUnit]);

  const formatHeight = useCallback((valueInCm) => {
    if (valueInCm == null) return { value: null, unit: isImperial ? 'in' : 'cm' };
    const converted = isImperial ? +(valueInCm * CM_TO_IN).toFixed(1) : +Number(valueInCm).toFixed(1);
    return { value: converted, unit: isImperial ? 'in' : 'cm' };
  }, [isImperial]);

  const toMetricWeight = useCallback((displayValue) => {
    if (displayValue == null) return null;
    return isImperial ? +(displayValue * LBS_TO_KG).toFixed(2) : +Number(displayValue);
  }, [isImperial]);

  const loadProfile = useCallback(async () => {
    try {
      const res = await profileAPI.get();
      if (res.data) {
        if (res.data.display_name) {
          setDisplayName(res.data.display_name);
          setAvatarLetter(res.data.display_name[0]);
        }
        setUnitPreference(res.data.unit_preference || 'metric');
        setAiPersona(res.data.ai_persona || 'friendly');
      }
    } catch (err) {
      console.error('Failed to load profile settings', err);
    } finally {
      setSettingsLoaded(true);
    }
  }, []);

  const updateSettings = useCallback(async (settings) => {
    if (settings.unit_preference) setUnitPreference(settings.unit_preference);
    if (settings.ai_persona) setAiPersona(settings.ai_persona);
    if (settings.display_name !== undefined) {
      setDisplayName(settings.display_name);
      setAvatarLetter(settings.display_name?.[0] || '');
    }
  }, []);

  return (
    <ProfileContext.Provider value={{
      displayName, setDisplayName,
      avatarLetter, setAvatarLetter,
      unitPreference, aiPersona,
      weightUnit, isImperial,
      formatWeight, formatHeight, toMetricWeight,
      loadProfile, updateSettings, settingsLoaded,
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
