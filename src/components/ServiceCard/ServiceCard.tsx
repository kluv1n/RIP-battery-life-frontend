import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  fallbackImageUrl,
  resolveMediaUrl,
  type BatteryServiceMock,
} from "../../modules/batteryApi";

function photoSrc(photo_url: string, imageError: boolean): string {
  if (imageError || !photo_url?.trim()) return fallbackImageUrl();
  return resolveMediaUrl(photo_url);
}

function catalogImageAlt(battery: BatteryServiceMock): string {
  const d = battery.short_description_en?.trim();
  if (!d) return battery.title;
  return `${battery.title}. ${d.length > 160 ? `${d.slice(0, 157)}…` : d}`;
}

function similarityPercent(raw: number): string {
  const pct = Math.max(0, Math.min(100, raw * 100));
  return `${pct.toFixed(1)}%`;
}

export default function ServiceCard({
  battery,
  similarity,
}: {
  battery: BatteryServiceMock;
  /** Cosine similarity SigLIP (≈ −1…1); сортировка по исходному значению. */
  similarity?: number;
}) {
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState(photoSrc(battery.photo_url, false));

  useEffect(() => {
    setImageError(false);
    setImageUrl(photoSrc(battery.photo_url, false));
  }, [battery.photo_url]);

  const handleImageError = () => {
    setImageError(true);
    setImageUrl(fallbackImageUrl());
  };

  const enShort = battery.short_description_en?.trim();

  return (
    <div className="card">
      <Link to={`/battery/${battery.battery_id}`} className="card__link">
        <div className="card__media">
          <img
            className="card__photo"
            src={imageError ? fallbackImageUrl() : imageUrl}
            alt={catalogImageAlt(battery)}
            width={400}
            height={300}
            decoding="async"
            onError={handleImageError}
          />
        </div>
        <h1>{battery.title}</h1>
        <p className="card__employees">
          Ёмкость и напряжение: {battery.capacity_mah} мА·ч, {battery.voltage_v} В
        </p>
        {enShort ? (
          <p className="card__description card__description--tail" lang="en">
            {enShort}
          </p>
        ) : (
          <p className="card__description card__description--tail" aria-hidden="true">
            &nbsp;
          </p>
        )}
        {similarity != null ? (
          <p className="card__similarity">Сходство: {similarityPercent(similarity)}</p>
        ) : null}
      </Link>
    </div>
  );
}
