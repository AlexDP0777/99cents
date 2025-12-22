'use client';

import { useEffect, useState, useRef } from 'react';
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

// 47 городов из 47 стран мира
const worldCities = [
  // Европа
  { city: 'Москва', country: 'Россия', lat: 55.7558, lng: 37.6173 },
  { city: 'Лондон', country: 'Великобритания', lat: 51.5074, lng: -0.1278 },
  { city: 'Париж', country: 'Франция', lat: 48.8566, lng: 2.3522 },
  { city: 'Берлин', country: 'Германия', lat: 52.52, lng: 13.405 },
  { city: 'Рим', country: 'Италия', lat: 41.9028, lng: 12.4964 },
  { city: 'Мадрид', country: 'Испания', lat: 40.4168, lng: -3.7038 },
  { city: 'Амстердам', country: 'Нидерланды', lat: 52.3676, lng: 4.9041 },
  { city: 'Варшава', country: 'Польша', lat: 52.2297, lng: 21.0122 },
  { city: 'Прага', country: 'Чехия', lat: 50.0755, lng: 14.4378 },
  { city: 'Вена', country: 'Австрия', lat: 48.2082, lng: 16.3738 },
  { city: 'Стокгольм', country: 'Швеция', lat: 59.3293, lng: 18.0686 },
  { city: 'Осло', country: 'Норвегия', lat: 59.9139, lng: 10.7522 },
  { city: 'Копенгаген', country: 'Дания', lat: 55.6761, lng: 12.5683 },
  { city: 'Хельсинки', country: 'Финляндия', lat: 60.1699, lng: 24.9384 },
  { city: 'Афины', country: 'Греция', lat: 37.9838, lng: 23.7275 },
  { city: 'Лиссабон', country: 'Португалия', lat: 38.7223, lng: -9.1393 },
  { city: 'Дублин', country: 'Ирландия', lat: 53.3498, lng: -6.2603 },
  { city: 'Брюссель', country: 'Бельгия', lat: 50.8503, lng: 4.3517 },
  { city: 'Цюрих', country: 'Швейцария', lat: 47.3769, lng: 8.5417 },
  { city: 'Будапешт', country: 'Венгрия', lat: 47.4979, lng: 19.0402 },
  { city: 'Бухарест', country: 'Румыния', lat: 44.4268, lng: 26.1025 },
  { city: 'Киев', country: 'Украина', lat: 50.4501, lng: 30.5234 },
  // Азия
  { city: 'Токио', country: 'Япония', lat: 35.6762, lng: 139.6503 },
  { city: 'Сеул', country: 'Южная Корея', lat: 37.5665, lng: 126.978 },
  { city: 'Пекин', country: 'Китай', lat: 39.9042, lng: 116.4074 },
  { city: 'Сингапур', country: 'Сингапур', lat: 1.3521, lng: 103.8198 },
  { city: 'Дубай', country: 'ОАЭ', lat: 25.2048, lng: 55.2708 },
  { city: 'Мумбаи', country: 'Индия', lat: 19.076, lng: 72.8777 },
  { city: 'Бангкок', country: 'Таиланд', lat: 13.7563, lng: 100.5018 },
  { city: 'Джакарта', country: 'Индонезия', lat: -6.2088, lng: 106.8456 },
  { city: 'Манила', country: 'Филиппины', lat: 14.5995, lng: 120.9842 },
  { city: 'Ханой', country: 'Вьетнам', lat: 21.0285, lng: 105.8542 },
  { city: 'Тель-Авив', country: 'Израиль', lat: 32.0853, lng: 34.7818 },
  { city: 'Стамбул', country: 'Турция', lat: 41.0082, lng: 28.9784 },
  // Америка
  { city: 'Нью-Йорк', country: 'США', lat: 40.7128, lng: -74.006 },
  { city: 'Торонто', country: 'Канада', lat: 43.6532, lng: -79.3832 },
  { city: 'Мехико', country: 'Мексика', lat: 19.4326, lng: -99.1332 },
  { city: 'Сан-Паулу', country: 'Бразилия', lat: -23.5505, lng: -46.6333 },
  { city: 'Буэнос-Айрес', country: 'Аргентина', lat: -34.6037, lng: -58.3816 },
  { city: 'Богота', country: 'Колумбия', lat: 4.711, lng: -74.0721 },
  { city: 'Лима', country: 'Перу', lat: -12.0464, lng: -77.0428 },
  { city: 'Сантьяго', country: 'Чили', lat: -33.4489, lng: -70.6693 },
  // Африка и Океания
  { city: 'Кейптаун', country: 'ЮАР', lat: -33.9249, lng: 18.4241 },
  { city: 'Каир', country: 'Египет', lat: 30.0444, lng: 31.2357 },
  { city: 'Найроби', country: 'Кения', lat: -1.2921, lng: 36.8219 },
  { city: 'Сидней', country: 'Австралия', lat: -33.8688, lng: 151.2093 },
  { city: 'Окленд', country: 'Новая Зеландия', lat: -36.8509, lng: 174.7645 },
];

const addOffset = (c: number) => c + (Math.random() - 0.5) * 0.3;
const randomDate = () => {
  const d = Math.floor(Math.random() * 30);
  return d === 0 ? 'Сегодня' : d + ' дн. назад';
};

const generateMockParticipants = (): Participant[] => {
  const participants: Participant[] = [];
  const totalTarget = 999;
  const perCity = Math.floor(totalTarget / worldCities.length);
  const remainder = totalTarget % worldCities.length;
  
  worldCities.forEach((city, i) => {
    const count = perCity + (i < remainder ? 1 : 0);
    for (let j = 0; j < count; j++) {
      participants.push({
        id: `p-${i}-${j}`,
        latitude: addOffset(city.lat),
        longitude: addOffset(city.lng),
        city: city.city,
        country: city.country,
        date: randomDate(),
      });
    }
  });
  return participants;
};

export default function ParticipantsMap() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    // Загрузка участников
    setParticipants(generateMockParticipants());
    setMapReady(true);

    // Симуляция новых участников из реальных городов
    const interval = setInterval(() => {
      const city = worldCities[Math.floor(Math.random() * worldCities.length)];
      const newParticipant: Participant = {
        id: `p-new-${Date.now()}`,
        latitude: addOffset(city.lat),
        longitude: addOffset(city.lng),
        city: city.city,
        country: city.country,
        date: 'Только что',
        isNew: true,
      };
      setParticipants((prev) => [...prev, newParticipant]);

      setTimeout(() => {
        setParticipants((prev) =>
          prev.map((p) => (p.id === newParticipant.id ? { ...p, isNew: false, date: 'Сегодня' } : p))
        );
      }, 2000);
    }, 8000);

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
