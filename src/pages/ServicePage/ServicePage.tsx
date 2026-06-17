import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Form from "react-bootstrap/Form";
import CatalogChrome from "../../components/CatalogChrome/CatalogChrome";
import { BATTERIES_MOCK, getMockBattery, addBatteryToMockLife } from "../../modules/mock";
import {
  fallbackImageUrl,
  resolveMediaUrl,
  type BatteryServiceMock,
} from "../../modules/batteryApi";

export default function ServicePage() {
  const [battery, setBattery] = useState<BatteryServiceMock | null>(null);
  const [mediaError, setMediaError] = useState(false);
  const [adding, setAdding] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      setBattery(null);
      return;
    }
    setMediaError(false);
    const n = Number(id);
    const resolved =
      getMockBattery(n) ?? BATTERIES_MOCK.find((b) => b.battery_id === n) ?? null;
    setBattery(resolved);
  }, [id]);

  const videoUrl = useMemo(() => (battery ? resolveMediaUrl(battery.video) : ""), [battery]);
  const posterUrl = useMemo(
    () => (battery ? resolveMediaUrl(battery.photo_url) || fallbackImageUrl() : fallbackImageUrl()),
    [battery],
  );

  const showVideo = Boolean(battery?.video?.trim()) && !mediaError;

  const handleCatalogSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate("/");
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!battery) return;
    setAdding(true);
    try {
      const result = await addBatteryToMockLife(battery.battery_id);
      if (!result.ok) {
        window.alert("message" in result ? result.message : "Не удалось добавить в заявку.");
        return;
      }
    } finally {
      setAdding(false);
    }
  };

  if (!id || !battery) {
    return (
      <div className="space">
        <p style={{ color: "var(--neter-text-muted)" }}>Услуга не найдена.</p>
      </div>
    );
  }

  const toolbarForm = (
    <form className="toolbar__search-form" onSubmit={handleCatalogSearch}>
      <span className="search-bar">
        <input
          type="text"
          name="query"
          className="search-input"
          placeholder="Поиск по типу аккумулятора"
          readOnly
          onFocus={() => navigate("/")}
        />
        <button type="submit" className="search-btn" aria-label="Найти">
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
      <CatalogChrome toolbarForm={toolbarForm} />
      <div className="detail-wrapper detail-wrapper--battery">
        <Link to="/" className="back-link">
          ← Вернуться к списку товаров
        </Link>
        <div className="detail-card detail-card--split">
          <div className="detail-card__media">
            <div
              className="detail-card__video-frame detail-card__video-frame--desc"
              tabIndex={0}
              role="region"
              aria-label="Видео и описание по наведению"
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
                  onError={() => setMediaError(true)}
                >
                  <source src={videoUrl} type="video/mp4" />
                </video>
              ) : (
                <img className="detail-card__video" src={posterUrl} alt={battery.title} />
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
                      <span className="detail-stat__unit">мА·ч</span>
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
                      <span className="detail-stat__unit">В</span>
                    </div>
                  </div>
                </div>
                <div className="detail-video-desc__bottom">
                  <h1 className="detail-video-desc__title">{battery.title}</h1>
                  <p className="detail-video-desc__short">{battery.short_description}</p>
                  <div className="detail-video-desc__metrics-text">
                    <p className="detail-video-desc__metric-row">
                      <strong>Ток:</strong> {battery.detail_current_a_str} А
                    </p>
                    <p className="detail-video-desc__metric-row">
                      <strong>Время работы:</strong> {battery.detail_runtime_hours_str} ч
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <aside className="detail-card__actions">
            <Form className="add-to-cart-form add-to-cart-form--aside" onSubmit={handleAdd}>
              <button type="submit" className="cart-button cart-button--block" disabled={adding}>
                {adding ? "Добавление…" : "Добавить в заявку"}
              </button>
            </Form>
          </aside>
        </div>
      </div>
    </>
  );
}
