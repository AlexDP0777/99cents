'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Participant {
  id: string;
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  date?: string;
  isNew?: boolean;
}

// Форматирование даты
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Сегодня';
  if (diffDays === 1) return 'Вчера';
  return `${diffDays} дн. назад`;
};

export default function ParticipantsMap() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    // Загружаем участников из API
    fetch('/api/participants')
      .then(res => res.json())
      .then(data => {
        const mapped = data.map((p: { id: string; latitude: number; longitude: number; city?: string; country?: string; date?: string }) => ({
          ...p,
          date: p.date ? formatDate(p.date) : undefined,
        }));
        setParticipants(mapped);
        setMapReady(true);
      })
      .catch(err => {
        console.error('Failed to load participants:', err);
        setMapReady(true);
      });

    // Периодически обновляем данные
    const interval = setInterval(() => {
      fetch('/api/participants')
        .then(res => res.json())
        .then(data => {
          const currentIds = new Set(participants.map(p => p.id));
          const mapped = data.map((p: { id: string; latitude: number; longitude: number; city?: string; country?: string; date?: string }) => ({
            ...p,
            date: p.date ? formatDate(p.date) : undefined,
            isNew: !currentIds.has(p.id),
          }));
          setParticipants(mapped);
          
          // Убираем флаг isNew через 3 секунды
          setTimeout(() => {
            setParticipants(prev => prev.map(p => ({ ...p, isNew: false })));
          }, 3000);
        })
        .catch(console.error);
    }, 30000); // Обновляем каждые 30 секунд

    return () => clearInterval(interval);
  }, []);

  if (!mapReady) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">Загрузка карты...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden shadow-sm border border-gray-200">
      <MapContainer
        center={[30, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={6}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        />
        {participants.map((participant) => (
          <CircleMarker
            key={participant.id}
            center={[participant.latitude, participant.longitude]}
            radius={participant.isNew ? 5 : 3}
            pathOptions={{
              color: participant.isNew ? '#22c55e' : '#1e3a5f',
              fillColor: participant.isNew ? '#22c55e' : '#1e3a5f',
              fillOpacity: participant.isNew ? 1 : 0.7,
              weight: participant.isNew ? 2 : 0,
            }}
          >
            <Popup>
              <div className="text-center min-w-[100px]">
                <div className="font-semibold text-[#1e3a5f]">{participant.city || 'Участник'}</div>
                <div className="text-gray-500 text-sm">{participant.country || ''}</div>
                <div className="text-xs text-gray-400 mt-1">{participant.date || ''}</div>
                {participant.isNew && <div className="text-xs text-green-500 font-medium mt-1">Новый!</div>}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
