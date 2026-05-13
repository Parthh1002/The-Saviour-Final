"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

// Center on Jim Corbett National Park (Real forest location)
const CENTER_LAT = 29.5300;
const CENTER_LNG = 78.7747;

const HEATMAP_ZONES = [
  // Red = High area of poaching / High animal strength
  { lat: 29.5350, lng: 78.7700, color: '#ef4444', radius: 800, label: 'High Poaching Risk - Elephant Herd Detected' },
  // Orange = Medium poaching risk
  { lat: 29.5250, lng: 78.7850, color: '#f97316', radius: 1000, label: 'Medium Risk - Border Vulnerability' },
  // Green = No poaching, stable animal strength
  { lat: 29.5400, lng: 78.7900, color: '#22c55e', radius: 1500, label: 'Secure Zone - Normal Activity' }
];

const CAMERAS = [
  { id: 'CAM-01', lat: 29.5350, lng: 78.7700, status: 'alert', zone: 'Sector Alpha (Red)' },
  { id: 'CAM-02', lat: 29.5250, lng: 78.7850, status: 'active', zone: 'Sector Bravo (Orange)' },
  { id: 'CAM-03', lat: 29.5400, lng: 78.7900, status: 'active', zone: 'Sector Charlie (Green)' },
];

export type MapMode = 'standard' | 'thermal' | 'night';

export type ForestLocation = {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  risk: string;
  surveillanceLevel: string;
  cameras: number;
  wildlifeDensity: string;
  humanProb: string;
  radius: number;
  color: string;
};

const INDIA_FORESTS: ForestLocation[] = [
  { id: 'F01', name: 'Jim Corbett National Park', state: 'Uttarakhand', lat: 29.5300, lng: 78.7747, risk: 'Critical', surveillanceLevel: 'Maximum (Tier 1)', cameras: 124, wildlifeDensity: 'High (Tigers, Elephants)', humanProb: '89%', radius: 2500, color: '#ef4444' },
  { id: 'F02', name: 'Kaziranga National Park', state: 'Assam', lat: 26.5775, lng: 93.1711, risk: 'High', surveillanceLevel: 'Advanced (Tier 2)', cameras: 85, wildlifeDensity: 'High (Rhinos)', humanProb: '65%', radius: 3000, color: '#f97316' },
  { id: 'F03', name: 'Ranthambore National Park', state: 'Rajasthan', lat: 26.0173, lng: 76.5026, risk: 'Medium', surveillanceLevel: 'Standard (Tier 3)', cameras: 56, wildlifeDensity: 'Medium (Tigers)', humanProb: '40%', radius: 1800, color: '#facc15' },
  { id: 'F04', name: 'Gir Forest National Park', state: 'Gujarat', lat: 21.1243, lng: 70.8242, risk: 'Low', surveillanceLevel: 'Standard (Tier 3)', cameras: 42, wildlifeDensity: 'Medium (Lions)', humanProb: '15%', radius: 2000, color: '#22c55e' },
  { id: 'F05', name: 'Sundarbans Reserve', state: 'West Bengal', lat: 21.9497, lng: 89.1833, risk: 'High', surveillanceLevel: 'Advanced (Tier 2)', cameras: 92, wildlifeDensity: 'High (Tigers, Crocs)', humanProb: '72%', radius: 4000, color: '#f97316' }
];

interface TrackingMapProps {
  mode: MapMode;
  onSelectLocation: (loc: ForestLocation) => void;
}


function LocationTracker({ setCoords }: { setCoords: (c: {lat: string, lng: string}) => void }) {
  useMapEvents({
    mousemove(e) {
      setCoords({
        lat: e.latlng.lat.toFixed(4),
        lng: e.latlng.lng.toFixed(4)
      });
    }
  });
  return null;
}

export default function TrackingMap({ mode, onSelectLocation }: TrackingMapProps) {
  const [coords, setCoords] = useState({ lat: '23.5937', lng: '78.9629' });
  
  const getMapFilter = () => {
    if (mode === 'thermal') return 'contrast(1.5) saturate(2) hue-rotate(270deg) invert(1)';
    if (mode === 'night') return 'contrast(1.2) sepia(1) hue-rotate(80deg) brightness(0.8) saturate(3)';
    return 'none';
  };

  return (
    <div className="h-full w-full rounded-xl overflow-hidden z-0 relative shadow-[var(--shadow-elegant)] border border-border" style={{ filter: getMapFilter(), transition: 'filter 1s ease-in-out' }}>
      
      {/* Coordinates Display */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-background/90 backdrop-blur-md px-4 py-2 rounded-full border border-border shadow-sm text-xs font-mono flex items-center gap-4 text-foreground transition-all">
        <span className="flex items-center gap-2"><span className="text-primary">LAT:</span> {coords.lat}° N</span>
        <span className="flex items-center gap-2"><span className="text-primary">LNG:</span> {coords.lng}° E</span>
      </div>

      <MapContainer 
        key={mode} // Force re-mount on mode change to avoid "container in use" errors
        center={[23.5937, 78.9629]} // Center of India
        zoom={5} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', background: '#000' }}
        className="z-0"
        zoomControl={true}
        minZoom={4} 
        maxZoom={12}
        maxBounds={[[6.4626, 68.1097], [35.5133, 97.3953]]} 
      >
        <LocationTracker setCoords={setCoords} />
        
        <TileLayer
          key={mode} // Ensure tile layer also refreshes
          attribution=""
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          className="transition-all duration-1000"
        />

        {INDIA_FORESTS.map((forest) => (
          <Circle 
            key={forest.id}
            center={[forest.lat, forest.lng]} 
            pathOptions={{ 
              fillColor: mode === 'thermal' ? '#ff0000' : forest.color, 
              color: mode === 'thermal' ? '#ff0000' : forest.color, 
              fillOpacity: mode === 'thermal' ? 0.7 : 0.35,
              weight: 2,
              className: 'animate-pulse transition-all duration-300 hover:fillOpacity-0.8 hover:scale-105'
            }} 
            radius={forest.radius * 20} 
            eventHandlers={{
              click: () => onSelectLocation(forest),
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
              <span className="font-semibold">{forest.state}</span>
            </Tooltip>
            <Popup className="premium-popup">
              <div className="p-1 min-w-[150px]">
                <p className="font-bold text-sm mb-1 text-foreground">{forest.name}</p>
                <p className="text-xs text-secondary mb-2">{forest.state}</p>
                <div className="mb-2 text-[10px] text-muted-foreground flex justify-between">
                  <span>Risk: <span style={{color: forest.color}}>{forest.risk}</span></span>
                  <span>Cameras: {forest.cameras}</span>
                </div>
                <button 
                  onClick={() => onSelectLocation(forest)}
                  className="w-full bg-primary text-primary-foreground text-xs py-1.5 rounded font-medium shadow-sm hover:scale-[1.02] transition-transform"
                >
                  View Telemetry
                </button>
              </div>
            </Popup>
          </Circle>
        ))}

        {CAMERAS.map((cam) => (
          <Marker key={cam.id} position={[cam.lat, cam.lng]}>
            <Tooltip>{cam.id} - {cam.status}</Tooltip>
            <Popup>
              <div className="text-sm p-1">
                <p className="font-bold mb-1">{cam.id} <span className={`text-[10px] px-1.5 py-0.5 rounded ${cam.status === 'alert' ? 'bg-danger text-white' : 'bg-success text-white'}`}>{cam.status.toUpperCase()}</span></p>
                <p className="text-xs text-secondary">{cam.zone}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Overlay Scanning Lines for Night Vision */}
      {mode === 'night' && (
        <div className="absolute inset-0 pointer-events-none z-[400] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBNMzkuNSAwVjQwIiBzdHJva2U9InJnYmEoMCwyNTUsMCwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')]" />
      )}
    </div>
  );
}
