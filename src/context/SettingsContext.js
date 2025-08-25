import React, { createContext, useState, useContext } from 'react';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    theme: 'light',
    notifications: true,
    autoSave: true,
    language: 'en',
    voiceQuality: 'high',
    exportFormat: 'pdf'
  });

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetSettings = () => {
    setSettings({
      theme: 'light',
      notifications: true,
      autoSave: true,
      language: 'en',
      voiceQuality: 'high',
      exportFormat: 'pdf'
    });
  };

  const exportData = async () => {
    try {
      // Placeholder for data export
      console.log('Exporting user data...');
      return { success: true, message: 'Data exported successfully' };
    } catch (error) {
      console.error('Failed to export data:', error);
      return { success: false, message: 'Export failed', error: error.message };
    }
  };

  const deleteData = async () => {
    try {
      // Placeholder for data deletion
      console.log('Deleting user data...');
      return { success: true, message: 'Data deleted successfully' };
    } catch (error) {
      console.error('Failed to delete data:', error);
      return { success: false, message: 'Deletion failed', error: error.message };
    }
  };

  const value = {
    settings,
    updateSetting,
    resetSettings,
    exportData,
    deleteData
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
