import React, { useState, useEffect } from 'react';
import { ClinicAnnouncement } from '../types';

interface Props {
  announcements: ClinicAnnouncement[];
  rotationSpeed: number;
  primaryColor?: string;
  accentColor?: string;
  clockFormat?: '12h' | '24h';
  fontSize?: 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'xxxlarge';
}

export const AnnouncementSidebar: React.FC<Props> = ({
  announcements,
  rotationSpeed,
  primaryColor = 'var(--summit-navy)',
  accentColor = 'var(--summit-green)',
  clockFormat = '12h',
  fontSize = 'medium',
}) => {
  const activeAnnouncements = announcements.filter((a) => a.active);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Map font size
  const fontStyleMap = {
    small: { fontSize: '1rem', lineHeight: '1.4rem' },
    medium: { fontSize: '1.25rem', lineHeight: '1.75rem' },
    large: { fontSize: '1.65rem', lineHeight: '2.15rem' },
    xlarge: { fontSize: '2.25rem', lineHeight: '2.8rem' },
    xxlarge: { fontSize: '3rem', lineHeight: '3.6rem' },
    xxxlarge: { fontSize: '4rem', lineHeight: '4.8rem' },
  }[fontSize] || { fontSize: '1.25rem', lineHeight: '1.75rem' };

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
                ...fontStyleMap,
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

