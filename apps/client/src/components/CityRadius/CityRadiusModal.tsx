import { useState, useEffect } from "react";
import { X } from "lucide-react";
import CityRadiusMap from "./CityRadiusMap";

interface CityRadiusModalProps {
  initialCity?: string;
  initialRadius?: number;
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: { city: string; radius: number }) => void;
}

export default function CityRadiusModal({
  initialCity = "",
  initialRadius = 20,
  open,
  onClose,
  onConfirm,
}: CityRadiusModalProps) {
  const [city, setCity] = useState(initialCity);
  const [radius, setRadius] = useState<number>(initialRadius);

  useEffect(() => {
    setCity(initialCity);
  }, [initialCity]);

  useEffect(() => {
    setRadius(initialRadius);
  }, [initialRadius]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative bg-base-100 rounded-lg shadow-xl z-10 p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold">Localiser une ville</h3>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="h-full">
          <CityRadiusMap
            city={city}
            radius={radius}
            onCityChange={(c) => setCity(c)}
            onRadiusChange={(r) => setRadius(r)}
          />
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={onClose}
          >
            Annuler
          </button>

          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => {
              onConfirm({ city: city || "", radius: radius ?? 0 });
              onClose();
            }}
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}
