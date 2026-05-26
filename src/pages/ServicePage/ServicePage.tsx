import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CatalogChrome from "../../components/CatalogChrome/CatalogChrome";
import { BATTERIES_MOCK, getMockBattery, MOCK_COVER, MOCK_VIDEO } from "../../modules/mock";
import {
  fallbackImageUrl,
  getBatteryType,
  resolveMediaUrl,
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
  const [useOfflineMediaStub, setUseOfflineMediaStub] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

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
        setUseOfflineMediaStub(false);
        setBattery(remote);
        setLoading(false);
        return;
      }
      setUseOfflineMediaStub(true);
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
    if (useOfflineMediaStub) return MOCK_VIDEO;
    return resolveMediaUrl(battery.video);
  }, [battery, useOfflineMediaStub]);
  const posterUrl = useMemo(
    () => {
      if (!battery) return fallbackImageUrl();
      if (useOfflineMediaStub) return MOCK_COVER;
      return resolveMediaUrl(battery.photo_url) || fallbackImageUrl();
    },
    [battery, useOfflineMediaStub],
  );

  const showVideo = Boolean(battery?.video?.trim()) && !mediaError;

  const handleCatalogSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate("/");
  };

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

  const toolbarForm = (
    <form className="toolbar__search-form" onSubmit={handleCatalogSearch}>
      <label htmlFor="catalog-title-search-readonly" className="visually-hidden">
        Поиск по типу аккумулятора
      </label>
      <span className="search-bar">
        <input
          id="catalog-title-search-readonly"
          type="search"
          className="search-input"
          placeholder="Search by battery type"
          readOnly
          onFocus={() => navigate("/")}
        />
        <button type="submit" className="search-btn" aria-label="Search">
          <svg className="search-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
            <path
              d="M16 16l4 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </span>
    </form>
  );

  return (
    <>
      <CatalogChrome embedInLayout toolbarForm={toolbarForm} />
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
