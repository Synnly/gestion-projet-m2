import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Circle, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Component to recenter map when position changes
function RecenterMap({ position, zoom }: { position: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (position && Array.isArray(position)) {
      map.setView(position, zoom);
    }
  }, [position, zoom, map]);
  return null;
}

interface CityRadiusMapProps {
  city?: string;
  radius?: number;
  onCityChange?: (city: string) => void;
  onRadiusChange?: (radius: number) => void;
}

export default function CityRadiusMap({ 
  city: externalCity = "",
  radius: externalRadius = 20,
  onCityChange,
  onRadiusChange
}: CityRadiusMapProps) {
  const [city, setCity] = useState(externalCity);
  const [radius, setRadius] = useState(externalRadius);
  // Leaflet uses [lat, lon]
  const [position, setPosition] = useState<[number, number]>([48.8566, 2.3522]); // Paris par défaut
  const [zoom, setZoom] = useState<number>(11);

  // Sync with external props
  useEffect(() => {
    setCity(externalCity);
  }, [externalCity]);

  useEffect(() => {
    setRadius(externalRadius);
  }, [externalRadius]);

  // Fix default icon paths for Leaflet when using bundlers
  useEffect(() => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    });
  }, []);

  const geocodeCity = async () => {
    if (!city.trim()) return;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        city
      )}`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "fr" },
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Nominatim returns { lat, lon }
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
          setPosition([lat, lon]);
          // zoom a bit when searching a city
          setZoom(11);
        }
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    }
  };

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    onCityChange?.(newCity);
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    onRadiusChange?.(newRadius);
  };

  return (
    <div className="w-full h-[500px] flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Ville ou adresse"
            value={city}
            onChange={(e) => handleCityChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && geocodeCity()}
            className="input input-bordered input-sm w-full"
          />
        </div>

        <button onClick={geocodeCity} className="btn btn-primary btn-sm">
          Localiser
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-sm font-medium whitespace-nowrap">Rayon:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={radius}
            onChange={(e) => handleRadiusChange(Number(e.target.value))}
            className="range range-primary range-sm flex-1"
          />
          <div className="badge badge-primary badge-sm">{radius} km</div>
        </div>
      </div>

      <div className="w-full h-full rounded-xl overflow-hidden shadow-lg">
        <MapContainer center={position} zoom={zoom} className="w-full h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {/* RecenterMap uses the map instance to set view when position changes */}
          <RecenterMap position={position} zoom={zoom} />

          <Marker position={position} />

          <Circle
            center={position}
            radius={radius * 1000} // km -> mètres
            pathOptions={{ fillOpacity: 0.15, color: "#60A5FA", weight: 1 }}
          />
        </MapContainer>
      </div>
    </div>
  );
}
