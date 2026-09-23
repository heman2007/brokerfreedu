"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet's default marker icon references image paths that break under
// bundlers — point them at the CDN copies instead of trying to bundle them.
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Centered on North Campus, DU, by default.
const DEFAULT_CENTER: [number, number] = [28.6975, 77.2094];

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const [position, setPosition] = useState<[number, number]>(
    lat && lng ? [lat, lng] : DEFAULT_CENTER
  );

  function pick(newLat: number, newLng: number) {
    setPosition([newLat, newLng]);
    onChange(newLat, newLng);
  }

  return (
    <div>
      <div className="map-picker" style={{ height: 260 }}>
        <MapContainer center={position} zoom={15} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={pick} />
          <Marker
            position={position}
            draggable
            icon={markerIcon}
            eventHandlers={{
              dragend: (e) => {
                const m = e.target.getLatLng();
                pick(m.lat, m.lng);
              },
            }}
          />
        </MapContainer>
      </div>
      <p className="text-[13px] text-soft mt-1.5">
        Click anywhere on the map to drop the pin, or drag it to adjust. {position === DEFAULT_CENTER ? "Starting near North Campus — move it to the actual property." : `Pinned: ${position[0].toFixed(5)}, ${position[1].toFixed(5)}`}
      </p>
    </div>
  );
}
