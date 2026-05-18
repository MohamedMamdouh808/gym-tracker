import React, { createContext, useContext, useState } from 'react';

const ProfileContext = createContext({});

export const ProfileProvider = ({ children }) => {
  const [displayName, setDisplayName] = useState('');
  const [avatarLetter, setAvatarLetter] = useState('');

  return (
    <ProfileContext.Provider value={{ displayName, setDisplayName, avatarLetter, setAvatarLetter }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);