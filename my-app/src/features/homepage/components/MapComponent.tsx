// src/features/homepage/components/MapComponent.tsx
import React from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const mockPoints = [
  { id: 1, lng: 106.7000, lat: 10.7769 }, // Quận 1
  { id: 2, lng: 106.7333, lat: 10.8000 }, // Thảo Điền (Quận 2)
  { id: 3, lng: 106.6833, lat: 10.8333 }, // Gò Vấp
];

export const MapComponent: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '600px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <Map
        initialViewState={{ longitude: 106.7000, latitude: 10.7769, zoom: 12 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://tiles.openfreemap.org/styles/bright"
      >
        {mockPoints.map((p) => (
          <Marker key={p.id} longitude={p.lng} latitude={p.lat} color="#E03C31" />
        ))}
      </Map>
    </div>
  );
};