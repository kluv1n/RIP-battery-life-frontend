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
  const d = battery.short_description?.trim();
  if (!d) return battery.title;
  return `${battery.title}. ${d.length > 160 ? `${d.slice(0, 157)}…` : d}`;
}

function truncBlurb(text: string, maxLen: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1).trimEnd()}…`;
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

  const ru = truncBlurb(battery.description, 320);
  const en = truncBlurb(battery.short_description, 360);

  if (similarity != null) {
    return (
      <div className="card card--photo-rank">
        <Link to={`/battery/${battery.battery_id}`} className="card__link card__link--photo-rank">
          <div className="card__photo-rank-thumb">
            <img
              src={imageError ? fallbackImageUrl() : imageUrl}
              alt={catalogImageAlt(battery)}
              width={120}
              height={120}
              decoding="async"
              onError={handleImageError}
            />
          </div>
          <div className="card__photo-rank-body">
            <h1>{battery.title}</h1>
            <p className="card__employees">
              Capacity & voltage: {battery.capacity_mah} mAh, {battery.voltage_v} V
            </p>
            {ru ? <p className="card__photo-rank-ru">{ru}</p> : null}
            {en ? (
              <p className="card__photo-rank-en" lang="en">
                {en}
              </p>
            ) : null}
            <p className="card__similarity">Match: {similarityPercent(similarity)}</p>
          </div>
        </Link>
      </div>
    );
  }

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
          Capacity & voltage: {battery.capacity_mah} mAh, {battery.voltage_v} V
        </p>
        <p className="card__description card__description--tail">{battery.short_description}</p>
      </Link>
    </div>
  );
}
