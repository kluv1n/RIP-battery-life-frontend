import { Link } from "react-router-dom";
import { useEffect, useState, type MouseEvent } from "react";
import {
  fallbackImageUrl,
  resolveCatalogPhotoUrl,
  type BatteryServiceMock,
} from "../../modules/batteryApi";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { addBatteryTypeToBatteryLifeApplication } from "../../store/slices/batteryLifeApplicationSlice";

function photoSrc(battery: BatteryServiceMock, imageError: boolean): string {
  if (imageError) return fallbackImageUrl();
  return resolveCatalogPhotoUrl(battery) || fallbackImageUrl();
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
  similarity?: number;
}) {
  const dispatch = useAppDispatch();
  const applicationMutationLoading = useAppSelector(
    (s) => s.batteryLifeApplication.applicationMutationLoading,
  );
  const isAuthenticated = useAppSelector((s) => s.user.isAuthenticated);

  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState(photoSrc(battery, false));

  useEffect(() => {
    setImageError(false);
    setImageUrl(photoSrc(battery, false));
  }, [battery.battery_id, battery.photo_url]);

  const handleImageError = () => {
    setImageError(true);
    setImageUrl(fallbackImageUrl());
  };

  const handleAdd = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      window.alert("Войдите в систему, чтобы добавить тип аккумулятора в заявку.");
      return;
    }
    try {
      await dispatch(addBatteryTypeToBatteryLifeApplication(battery.battery_id)).unwrap();
    } catch (err) {
      window.alert(String(err));
    }
  };

  const ru = truncBlurb(battery.description, 320);
  const en = truncBlurb(battery.short_description, 360);

  const addBtn = (
    <button
      type="button"
      className="card-add-btn"
      onClick={handleAdd}
      disabled={applicationMutationLoading}
    >
      {applicationMutationLoading ? "Добавление…" : "Добавить в заявку"}
    </button>
  );

  if (similarity != null) {
    return (
      <div className="card-service-wrapper">
        <div className="card card--photo-rank">
          <Link
            to={`/battery/${battery.battery_id}`}
            state={{ battery }}
            className="card__link card__link--photo-rank"
          >
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
        {addBtn}
      </div>
    );
  }

  return (
    <div className="card-service-wrapper">
      <div className="card">
        <Link to={`/battery/${battery.battery_id}`} state={{ battery }} className="card__link">
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
      {addBtn}
    </div>
  );
}
