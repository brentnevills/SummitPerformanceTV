import React, { useState, useEffect } from 'react';
import { ClinicAnnouncement } from '../types';

interface Props {
  announcements: ClinicAnnouncement[];
  rotationSpeed: number;
  primaryColor?: string;
  accentColor?: string;
  clockFormat?: '12h' | '24h';
}

export const AnnouncementSidebar: React.FC<Props> = ({
  announcements,
  rotationSpeed,
  primaryColor = 'var(--summit-navy)',
  accentColor = 'var(--summit-green)',
  clockFormat = '12h',
}) => {
  const activeAnnouncements = announcements.filter((a) => a.active);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Time and Date State
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  // Clock interval
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const time = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: clockFormat === '12h',
      });
      const date = now.toLocaleDateString([], {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
      setTimeStr(time);
      setDateStr(date);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [clockFormat]);

  // Announcement Carousel Rotation
  useEffect(() => {
    if (activeAnnouncements.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
    }, Math.max(3000, rotationSpeed));

    return () => clearInterval(timer);
  }, [activeAnnouncements.length, rotationSpeed]);

  return (
    <div
      className="sidebar"
      style={{
        borderRightColor: primaryColor,
      }}
    >
      <h2 style={{ borderColor: accentColor, color: primaryColor }}>
        Announcements
      </h2>

      <div id="info-container">
        {activeAnnouncements.map((item, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={item.id}
              className={`info-item ${isActive ? 'active' : ''}`}
              style={{
                color: primaryColor,
                borderLeftColor: accentColor,
              }}
            >
              {item.text}
            </div>
          );
        })}

        {activeAnnouncements.length === 0 && (
          <div className="info-item active" style={{ color: primaryColor, borderLeftColor: accentColor }}>
            Summit Performance Rehab & Wellness Centre
          </div>
        )}
      </div>

      <div id="clock-container" style={{ borderTopColor: primaryColor }}>
        <span id="time" style={{ color: primaryColor }}>
          {timeStr || '10:00 AM'}
        </span>
        <span id="date" style={{ color: accentColor }}>
          {dateStr || 'Monday, Aug 10'}
        </span>
      </div>
    </div>
  );
};

