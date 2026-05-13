import { useCallback, useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import Button from "react-bootstrap/Button";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "../../routePaths";
import { cloneBatteryLifeDetail, MOCK_BATTERY_LIFE_DETAIL } from "../../modules/mock";
import {
  fallbackImageUrl,
  resolveMediaUrl,
  type BatteryLifeDetailResponse,
  type BatteryLifeItemDetailJSON,
} from "../../modules/batteryApi";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  deleteBatteryLifeApplication,
  fetchBatteryLifeApplicationDetail,
  formBatteryLifeApplication,
  removeBatteryLifeItemLine,
  updateBatteryLifeApplicationDraft,
  updateBatteryLifeItemLine,
} from "../../store/slices/batteryLifeApplicationSlice";
import { applicationStatusLabelEn } from "../../utils/applicationStatusEn";
import "./BatteryLifePage.css";

type RowDraft = Pick<BatteryLifeItemDetailJSON, "current_ma" | "quantity">;

export default function BatteryLifePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isModerator } = useAppSelector((s) => s.user);
  const { detail, detailLoading, detailError, applicationMutationLoading, itemMutationLoading } =
    useAppSelector((s) => s.batteryLifeApplication);

  const [mockData, setMockData] = useState<BatteryLifeDetailResponse | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [rowDrafts, setRowDrafts] = useState<Record<number, RowDraft>>({});

  const reloadMock = useCallback(() => {
    if (!id) return;
    const n = Number(id);
    if (n === MOCK_BATTERY_LIFE_DETAIL.battery_life.battery_life_id) {
      setMockData(cloneBatteryLifeDetail(MOCK_BATTERY_LIFE_DETAIL));
    } else {
      setMockData(null);
    }
  }, [id]);

  useEffect(() => {
    if (!id || !isAuthenticated) return;
    setMockData(null);
    void dispatch(fetchBatteryLifeApplicationDetail(Number(id))).then((a) => {
      if (fetchBatteryLifeApplicationDetail.rejected.match(a)) {
        reloadMock();
      }
    });
  }, [id, isAuthenticated, dispatch, reloadMock]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.SIGN_IN, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const data = detail ?? mockData;

  useEffect(() => {
    if (!data) return;
    setTitleDraft(data.battery_life.title || "");
    setDescriptionDraft(data.battery_life.description ?? "");
    const next: Record<number, RowDraft> = {};
    data.items.forEach((row) => {
      next[row.battery_id] = {
        current_ma: row.current_ma,
        quantity: row.quantity,
      };
    });
    setRowDrafts(next);
  }, [data]);

  const life = data?.battery_life;
  const applicationId = life?.battery_life_id;
  const statusNorm = (life?.status ?? "").trim().toLowerCase();
  const isDraft = statusNorm === "draft" || statusNorm === "черновик";
  const busy = applicationMutationLoading || detailLoading;
  const headerPlaintext = !isDraft && !mockData;

  const updateRowDraft = useCallback((batteryTypeId: number, patch: Partial<RowDraft>) => {
    setRowDrafts((prev) => {
      const base = prev[batteryTypeId] ?? { current_ma: 0, quantity: 1 };
      return { ...prev, [batteryTypeId]: { ...base, ...patch } };
    });
  }, []);

  const lineBusyKey = (bid: number) =>
    Boolean(itemMutationLoading[`line-${bid}-${applicationId ?? 0}`]);
  const rmBusy = (bid: number) => Boolean(itemMutationLoading[`rm-${bid}`]);

  const handleSaveHeader = () => {
    if (!applicationId || !isDraft || mockData) return;
    void dispatch(
      updateBatteryLifeApplicationDraft({
        applicationId,
        body: { title: titleDraft, description: descriptionDraft },
      }),
    );
  };

  const handleSaveRow = (batteryTypeId: number) => {
    if (!applicationId || !isDraft || mockData) return;
    const d = rowDrafts[batteryTypeId];
    if (!d) return;
    const row = data?.items.find((i) => i.battery_id === batteryTypeId);
    void dispatch(
      updateBatteryLifeItemLine({
        batteryTypeId,
        batteryLifeId: applicationId,
        body: {
          battery_life_id: applicationId,
          battery_type_id: batteryTypeId,
          current_ma: d.current_ma,
          quantity: d.quantity,
          runtime_hours: row?.runtime_hours ?? 0,
        },
      }),
    );
  };

  const handleRemoveRow = (batteryTypeId: number) => {
    if (!applicationId || !isDraft || mockData) return;
    if (!window.confirm("Убрать тип аккумулятора из заявки?")) return;
    void dispatch(removeBatteryLifeItemLine({ batteryTypeId, batteryLifeId: applicationId }));
  };

  const handleForm = () => {
    if (!applicationId || !isDraft || mockData) return;
    void dispatch(formBatteryLifeApplication(applicationId));
  };

  const handleDeleteApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId || !isDraft) return;
    if (!window.confirm("Удалить заявку?")) return;
    if (mockData) {
      navigate("/", { replace: true });
      return;
    }
    void dispatch(deleteBatteryLifeApplication(applicationId)).then(() => {
      navigate("/", { replace: true });
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  if (detailLoading && !data) {
    return (
      <div className="battery-life-page">
        <div className="services-loading">
          <Spinner animation="border" />
        </div>
      </div>
    );
  }

  if (!data || !life || applicationId == null) {
    return (
      <div className="battery-life-detail">
        <p className="application-not-found" style={{ padding: "24px" }}>
          {detailError ? detailError : "Заявка не найдена."}
        </p>
      </div>
    );
  }

  return (
    <div className="battery-life-page">
      {busy ? (
        <div className="battery-life-page__blocking" aria-live="polite">
          <Spinner animation="border" size="sm" /> Обработка…
        </div>
      ) : null}
      <div className={`battery-life-detail ${busy ? "battery-life-detail--blocked" : ""}`}>
        <Link to="/" className="back-link">
          ← К каталогу
        </Link>
        <div className="battery-life-detail__header-card">
          <h1 className="battery-life-detail__title">Заявка № {applicationId}</h1>
          <div className="battery-life-detail__info">
            <div className="battery-life-detail__info-item">
              <strong>ID заявки:</strong> {applicationId}
            </div>
            <div className="battery-life-detail__info-item">
              <strong>Статус:</strong> {applicationStatusLabelEn(life.status)}
            </div>
            <div className="battery-life-detail__info-item">
              <strong>Позиций в заявке:</strong> {data.items.length}
            </div>
            <div className="battery-life-detail__info-item">
              <strong>Создатель:</strong> {life.creator_login || "—"}
            </div>
            {life.moderator_login ? (
              <div className="battery-life-detail__info-item">
                <strong>Модератор:</strong> {life.moderator_login}
              </div>
            ) : null}
          </div>

          <Form.Group className="mb-2 mt-2" controlId="bl-title">
            <Form.Label>Название</Form.Label>
            <Form.Control
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              readOnly={!isDraft || Boolean(mockData)}
              plaintext={headerPlaintext}
            />
          </Form.Group>
          <Form.Group className="mb-2" controlId="bl-desc">
            <Form.Label>Описание</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              readOnly={!isDraft || Boolean(mockData)}
              plaintext={headerPlaintext}
            />
          </Form.Group>
          {isDraft && !mockData ? (
            <Button variant="primary" size="sm" className="me-2" onClick={handleSaveHeader} disabled={busy}>
              Сохранить заголовок
            </Button>
          ) : null}

          <div className="battery-life-detail__result mt-3">
            <strong>Суммарное время работы набора:</strong>
            <span className="battery-life-detail__result-value">
              {life.total_runtime_hours.toFixed(2)} ч
            </span>
          </div>

          {isDraft ? (
            <div className="mt-3 d-flex flex-wrap gap-2">
              <Button variant="success" size="sm" onClick={handleForm} disabled={busy || Boolean(mockData)}>
                Сформировать заявку
              </Button>
              <form action="#" onSubmit={handleDeleteApplication} className="d-inline">
                <Button type="submit" variant="outline-secondary" size="sm" disabled={busy}>
                  Удалить заявку
                </Button>
              </form>
            </div>
          ) : null}
        </div>

        {isDraft && !mockData ? (
          <p className="battery-life-detail__hint small text-muted mb-3">
            Доступны действия с заявкой и её строками: сохранение названия и описания, сохранение строк
            таблицы, удаление строки, сформировать заявку и удалить черновик.
          </p>
        ) : !isDraft ? (
          <p className="battery-life-detail__hint small text-muted mb-3">
            <strong>Режим просмотра.</strong> Отображаются данные, которые передал создатель; на этой
            странице заявку изменить нельзя.
            {isModerator && statusNorm === "formed" ? (
              <>
                {" "}
                Чтобы <strong>завершить</strong> или <strong>отклонить</strong> заявку, откройте{" "}
                <Link to={ROUTES.BATTERY_LIVES}>раздел «Заявки»</Link> и воспользуйтесь кнопками в строке
                таблицы.
              </>
            ) : null}
            {!isModerator && statusNorm === "formed" ? (
              <> Ожидайте решения модератора.</>
            ) : null}
          </p>
        ) : null}

        <h2 className="battery-life-detail__section-title">Позиции в заявке</h2>
        <div className="battery-life-items">
          {data.items.map((row: BatteryLifeItemDetailJSON) => {
            const hasPhoto = Boolean(row.battery.photo_url?.trim());
            const photoSrcUrl = hasPhoto ? resolveMediaUrl(row.battery.photo_url) : "";
            const hasVideo = Boolean(row.battery.video?.trim());
            const runtimeTotal = (row.runtime_hours ?? 0) * row.quantity;
            const draft = rowDrafts[row.battery_id];
            const lineBusy = lineBusyKey(row.battery_id);
            const removeBusy = rmBusy(row.battery_id);
            return (
              <article
                key={`${row.battery_life_id}-${row.battery_id}`}
                className="battery-life-item-card"
              >
                <div className="battery-life-item-card__media">
                  {hasPhoto ? (
                    <img
                      className="battery-life-item-card__photo"
                      src={photoSrcUrl}
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
                      <video className="battery-life-item-card__video" controls muted playsInline preload="metadata">
                        <source src={resolveMediaUrl(row.battery.video)} type="video/mp4" />
                      </video>
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
                  {isDraft && draft && !mockData ? (
                    <div className="battery-life-item-card__user-fields">
                      <Form.Group className="mb-2">
                        <Form.Label>Ток, мА</Form.Label>
                        <Form.Control
                          type="number"
                          min={1}
                          value={draft.current_ma}
                          onChange={(e) =>
                            updateRowDraft(row.battery_id, { current_ma: Number(e.target.value) || 0 })
                          }
                        />
                      </Form.Group>
                      <Form.Group className="mb-2">
                        <Form.Label>Количество</Form.Label>
                        <Form.Control
                          type="number"
                          min={1}
                          value={draft.quantity}
                          onChange={(e) =>
                            updateRowDraft(row.battery_id, { quantity: Number(e.target.value) || 1 })
                          }
                        />
                      </Form.Group>
                      <div className="d-flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={busy || lineBusy}
                          onClick={() => handleSaveRow(row.battery_id)}
                        >
                          Сохранить строку
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          disabled={busy || removeBusy}
                          onClick={() => handleRemoveRow(row.battery_id)}
                        >
                          Удалить
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="battery-life-item-card__user-fields">
                      <p className="battery-life-item-card__line">
                        <strong>Ток:</strong> {row.current_ma} мА
                      </p>
                      <p className="battery-life-item-card__line">
                        <strong>Количество:</strong> {row.quantity}
                      </p>
                    </div>
                  )}
                  <div className="battery-life-item-card__result">
                    <p className="battery-life-item-card__line">
                      <strong>Время на единицу:</strong> {(row.runtime_hours ?? 0).toFixed(2)} ч
                    </p>
                    <p className="battery-life-item-card__line">
                      <strong>По позиции:</strong> {runtimeTotal.toFixed(2)} ч
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
    </div>
  );
}
