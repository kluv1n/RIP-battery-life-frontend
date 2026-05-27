import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CatalogChrome from "../../components/CatalogChrome/CatalogChrome";
import { BATTERIES_MOCK, getMockBattery } from "../../modules/mock";
import {
  fallbackImageUrl,
  getBatteryType,
  resolveCatalogPhotoUrl,
  resolveCatalogVideoUrl,
  type BatteryServiceMock,
} from "../../modules/batteryApi";
function detailMediaAlt(b: BatteryServiceMock): string {
  const d = b.short_description?.trim();
  if (!d) return b.title;
  return `${b.title}. ${d.length > 160 ? `${d.slice(0, 157)}…` : d}`;
}

export default function ServicePage() {
  const [battery, setBattery] = useState<BatteryServiceMock | null>(null);
  const [mediaError, setMediaError] = useState(false);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      if (!id) {
        setBattery(null);
        setLoading(false);
        return;
      }
      setMediaError(false);
      const n = Number(id);
      const remote = await getBatteryType(n);
      if (cancelled) return;
      if (remote) {
        setBattery(remote);
        setLoading(false);
        return;
      }
      const resolved = getMockBattery(n) ?? BATTERIES_MOCK.find((b) => b.battery_id === n) ?? null;
      setBattery(resolved);
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const videoUrl = useMemo(() => {
    if (!battery) return "";
    return resolveCatalogVideoUrl(battery);
  }, [battery]);
  const posterUrl = useMemo(() => {
    if (!battery) return fallbackImageUrl();
    return resolveCatalogPhotoUrl(battery) || fallbackImageUrl();
  }, [battery]);

  const showVideo = Boolean(battery?.video?.trim()) && !mediaError;

  if (!id || (!loading && !battery)) {
    return (
      <div className="space">
        <p style={{ color: "var(--neter-text-muted)" }}>Battery type not found.</p>
      </div>
    );
  }

  if (loading || !battery) {
    return (
      <div className="space">
        <p style={{ color: "var(--neter-text-muted)" }}>Loading…</p>
      </div>
    );
  }

  return (
    <>
      <CatalogChrome embedInLayout />
      <div className="detail-wrapper detail-wrapper--battery">
        <Link to="/" className="back-link">
          ← Back to catalog
        </Link>
        <div className="detail-card detail-card--split">
          <div className="detail-card__media">
            <div
              className="detail-card__video-frame detail-card__video-frame--desc"
              tabIndex={0}
              role="region"
              aria-label="Video and summary overlay"
            >
              {showVideo ? (
                <video
                  className="detail-card__video"
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster={posterUrl}
                  aria-label={detailMediaAlt(battery)}
                  onError={() => setMediaError(true)}
                >
                  <source src={videoUrl} type="video/mp4" />
                </video>
              ) : (
                <img className="detail-card__video" src={posterUrl} alt={detailMediaAlt(battery)} />
              )}
              <div className="detail-video-desc">
                <div className="detail-video-desc__rail">
                  <div className="detail-video-desc__rail-panel">
                    <div className="detail-stat detail-stat--rail">
                      <svg className="detail-stat__icon" viewBox="0 0 24 24" aria-hidden="true">
                        <rect
                          x="6"
                          y="7"
                          width="12"
                          height="10"
                          rx="2"
                          ry="2"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <path d="M10 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <span className="detail-stat__value">{battery.capacity_mah}</span>
                      <span className="detail-stat__unit">mAh</span>
                    </div>
                    <div className="detail-stat detail-stat--rail">
                      <svg className="detail-stat__icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M13 2L4 14h7l-1 8 10-12h-7l0-8z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="detail-stat__value">{battery.voltage_v.toFixed(1)}</span>
                      <span className="detail-stat__unit">V</span>
                    </div>
                  </div>
                </div>
                <div className="detail-video-desc__bottom">
                  <h1 className="detail-video-desc__title">{battery.title}</h1>
                  <p className="detail-video-desc__short">{battery.short_description}</p>
                  <div className="detail-video-desc__metrics-text">
                    <p className="detail-video-desc__metric-row">
                      <strong>Current:</strong> {battery.detail_current_a_str} A
                    </p>
                    <p className="detail-video-desc__metric-row">
                      <strong>Runtime:</strong> {battery.detail_runtime_hours_str} h
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
