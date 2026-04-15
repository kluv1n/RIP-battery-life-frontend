import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BatteryLifeHeader from "../../components/BatteryLifeHeader/BatteryLifeHeader";
import { cloneBatteryLifeDetail, MOCK_BATTERY_LIFE_DETAIL } from "../../modules/mock";
import {
  fallbackImageUrl,
  resolveMediaUrl,
  type BatteryLifeDetailResponse,
  type BatteryLifeItemDetailJSON,
} from "../../modules/batteryApi";

function statusLabelRu(status: string): string {
  const m: Record<string, string> = {
    draft: "Черновик",
    deleted: "Удалена",
    formed: "Сформирована",
    completed: "Завершена",
    rejected: "Отклонена",
  };
  return m[status] ?? status;
}

export default function BatteryLifePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<BatteryLifeDetailResponse | null>(null);

  const loadMock = useCallback(() => {
    if (!id) return null;
    const n = Number(id);
    if (n === MOCK_BATTERY_LIFE_DETAIL.battery_life.battery_life_id) {
      return cloneBatteryLifeDetail(MOCK_BATTERY_LIFE_DETAIL);
    }
    return null;
  }, [id]);

  useEffect(() => {
    setData(loadMock());
  }, [loadMock]);

  const handleDelete = (e: FormEvent) => {
    e.preventDefault();
    if (!window.confirm("Удалить заявку?")) return;
    navigate("/");
  };

  if (!data) {
    return (
      <>
        <BatteryLifeHeader />
        <div className="battery-life-detail">
          <p className="application-not-found" style={{ padding: "24px" }}>
            Заявка не найдена.
          </p>
        </div>
      </>
    );
  }

  const life = data.battery_life;
  const isDraft = life.status === "draft";

  return (
    <>
      <BatteryLifeHeader />
      <div className="battery-life-detail">
        <Link to="/" className="back-link">
          ← Вернуться к списку товаров
        </Link>
        <div className="battery-life-detail__header-card">
          <h1 className="battery-life-detail__title">Подборка № {life.battery_life_id}</h1>
          <div className="battery-life-detail__info">
            <div className="battery-life-detail__info-item">
              <strong>Название заявки:</strong> {life.title || "—"}
            </div>
            <div className="battery-life-detail__info-item">
              <strong>Описание:</strong> {life.description || "—"}
            </div>
            <div className="battery-life-detail__info-item">
              <strong>Статус:</strong> {statusLabelRu(life.status)}
            </div>
          </div>
          <div className="battery-life-detail__result">
            <strong>Суммарное время работы набора:</strong>
            <span className="battery-life-detail__result-value">
              {life.total_runtime_hours.toFixed(2)} ч
            </span>
          </div>
          {isDraft ? (
            <form action="#" onSubmit={handleDelete} style={{ marginTop: 16 }}>
              <button
                type="submit"
                className="cart-button"
                style={{ backgroundColor: "var(--neter-text-muted)" }}
              >
                Удалить заявку
              </button>
            </form>
          ) : null}
        </div>

        <h2 className="battery-life-detail__section-title">Услуги в заявке</h2>
        <div className="battery-life-items">
          {data.items.map((row: BatteryLifeItemDetailJSON) => {
            const hasPhoto = Boolean(row.battery.photo_url?.trim());
            const photoSrc = hasPhoto ? resolveMediaUrl(row.battery.photo_url) : "";
            const hasVideo = Boolean(row.battery.video?.trim());
            const runtimeTotal = (row.runtime_hours ?? 0) * row.quantity;
            return (
              <article key={`${row.battery_life_id}-${row.battery_id}`} className="battery-life-item-card">
                <div className="battery-life-item-card__media">
                  {hasPhoto ? (
                    <img
                      className="battery-life-item-card__photo"
                      src={photoSrc}
                      alt={row.battery.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = fallbackImageUrl();
                      }}
                    />
                  ) : (
                    <div className="battery-life-item-card__photo battery-life-item-card__photo--placeholder">
                      Нет фото
                    </div>
                  )}
                  {hasVideo ? (
                    <div className="battery-life-item-card__video-block">
                      <video
                        className="battery-life-item-card__video"
                        controls
                        muted
                        playsInline
                        preload="metadata"
                      >
                        <source src={resolveMediaUrl(row.battery.video)} type="video/mp4" />
                      </video>
                      <a
                        className="battery-life-item-card__video-link"
                        href={resolveMediaUrl(row.battery.video)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Открыть видео в новой вкладке
                      </a>
                    </div>
                  ) : (
                    <div className="battery-life-item-card__video-block battery-life-item-card__video-block--empty">
                      Видео не указано
                    </div>
                  )}
                </div>
                <div className="battery-life-item-card__body">
                  <h3 className="battery-life-item-card__title">{row.battery.title}</h3>
                  <p className="battery-life-item-card__line">
                    <strong>Ёмкость и напряжение:</strong> {row.battery.capacity_mah} мА·ч,{" "}
                    {row.battery.voltage_v} В
                  </p>
                  {row.battery.short_description ? (
                    <p className="battery-life-item-card__line battery-life-item-card__short">
                      {row.battery.short_description}
                    </p>
                  ) : null}
                  <div className="battery-life-item-card__user-fields">
                    <p className="battery-life-item-card__line">
                      <strong>Потребляемый ток (ввод пользователя):</strong> {row.current_ma} мА
                    </p>
                    <p className="battery-life-item-card__line">
                      <strong>Количество (ввод пользователя):</strong> {row.quantity}
                    </p>
                  </div>
                  <div className="battery-life-item-card__result">
                    <p className="battery-life-item-card__line">
                      <strong>Время работы на единицу:</strong> {(row.runtime_hours ?? 0).toFixed(2)} ч
                    </p>
                    <p className="battery-life-item-card__line">
                      <strong>По позиции (всего):</strong> {runtimeTotal.toFixed(2)} ч
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="battery-life-detail__footer-total">
          <strong>Итог по заявке:</strong>
          <span className="battery-life-detail__result-value">
            {life.total_runtime_hours.toFixed(2)} ч
          </span>
        </div>
      </div>
    </>
  );
}
