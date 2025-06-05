// src/contexts/NotificationContext.js
import React, { createContext, useContext, useState } from 'react';

// Create the context
const NotificationContext = createContext();

// Provider component to wrap your app or part of it
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Function to add a new notification at the top of the list
  const addNotification = (notification) => {
    setNotifications(prevNotifications => [notification, ...prevNotifications]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notifications context easily
export const useNotification = () => useContext(NotificationContext);
