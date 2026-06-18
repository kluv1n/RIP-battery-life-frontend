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
import { applicationStatusLabel } from "../../utils/applicationStatusLabel";
import "./BatteryLifePage.css";

type RowDraft = Pick<BatteryLifeItemDetailJSON, "current_ma" | "quantity">;

const THEME_PLACEHOLDER = "Кратко укажите тему или сценарий эксплуатации набора АКБ";

const isGuestApp = import.meta.env.VITE_GUEST_APP === "true";

export default function BatteryLifePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isModerator } = useAppSelector((s) => s.user);
  const { detail, detailLoading, detailError, applicationMutationLoading, itemMutationLoading } =
    useAppSelector((s) => s.batteryLifeApplication);

  const [mockData, setMockData] = useState<BatteryLifeDetailResponse | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
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
    if (!id) return;
    if (isGuestApp) {
      reloadMock();
      return;
    }
    if (!isAuthenticated) return;
    setMockData(null);
    void dispatch(fetchBatteryLifeApplicationDetail(Number(id))).then((a) => {
      if (fetchBatteryLifeApplicationDetail.rejected.match(a)) {
        reloadMock();
      }
    });
  }, [id, isAuthenticated, dispatch, reloadMock]);

  useEffect(() => {
    if (isGuestApp) return;
    if (!isAuthenticated) {
      navigate(ROUTES.SIGN_IN, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const data = detail ?? mockData;

  useEffect(() => {
    if (!data) return;
    setTitleDraft(data.battery_life.title || "");
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
  const themeEditable = isDraft && !mockData;

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
        body: { title: titleDraft, description: "" },
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

  if (!isGuestApp && !isAuthenticated) {
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
        <div className="battery-life-detail__header-card">
          <h1 className="battery-life-detail__title">Заявка на расчёт времени работы АКБ</h1>
          <div className="battery-life-detail__info">
            <div className="battery-life-detail__info-item">
              <strong>ID заявки:</strong> {applicationId}
            </div>
            <div className="battery-life-detail__info-item">
              <strong>Статус:</strong> {applicationStatusLabel(life.status)}
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

          <div className="mb-2 mt-2 battery-life-detail__theme">
            {themeEditable ? (
              <Form.Group controlId="bl-theme">
                <Form.Label>Тема заявки</Form.Label>
                <div className="battery-life-detail__theme-input-wrap">
                  {titleDraft.length === 0 ? (
                    <span className="battery-life-detail__theme-hint" aria-hidden>
                      {THEME_PLACEHOLDER}
                    </span>
                  ) : null}
                  <Form.Control
                    as="textarea"
                    rows={2}
                    className={`battery-life-detail__theme-field${titleDraft.length === 0 ? " battery-life-detail__theme-field--empty" : ""}`}
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                  />
                </div>
              </Form.Group>
            ) : (
              <>
                <div className="form-label">Тема заявки</div>
                <div className="battery-life-detail__theme-readonly" id="bl-theme-readonly">
                  {titleDraft.trim() ? titleDraft : "—"}
                </div>
              </>
            )}
          </div>
          {isDraft && !mockData ? (
            <Button variant="outline-primary" size="sm" className="me-2" onClick={handleSaveHeader} disabled={busy}>
              Сохранить тему заявки
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
            Доступны действия с заявкой и её строками: сохранение темы заявки, сохранение строк,
            удаление строки, сформировать заявку и удалить черновик.
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
        <div className="battery-life-items-table">
          <div
            className={`battery-life-items-table__head${isDraft && !mockData ? " battery-life-items-table__head--draft" : ""}`}
            aria-hidden
          >
            <span className="battery-life-items-table__col battery-life-items-table__col--photo">
              Фото
            </span>
            <span className="battery-life-items-table__col battery-life-items-table__col--title">
              Тип АКБ
            </span>
            <span className="battery-life-items-table__col battery-life-items-table__col--spec">
              Ёмкость
            </span>
            <span className="battery-life-items-table__col battery-life-items-table__col--current">
              Ток, мА
            </span>
            <span className="battery-life-items-table__col battery-life-items-table__col--qty">
              Кол-во
            </span>
            <span className="battery-life-items-table__col battery-life-items-table__col--unit">
              Результат, ч (ед.)
            </span>
            <span className="battery-life-items-table__col battery-life-items-table__col--total">
              Результат, ч (поз.)
            </span>
            {isDraft && !mockData ? (
              <span className="battery-life-items-table__col battery-life-items-table__col--actions">
                Действия
              </span>
            ) : null}
          </div>
          {data.items.map((row: BatteryLifeItemDetailJSON) => {
            const hasPhoto = Boolean(row.battery.photo_url?.trim());
            const photoSrcUrl = hasPhoto ? resolveMediaUrl(row.battery.photo_url) : "";
            const runtimeTotal = (row.runtime_hours ?? 0) * row.quantity;
            const draft = rowDrafts[row.battery_id];
            const lineBusy = lineBusyKey(row.battery_id);
            const removeBusy = rmBusy(row.battery_id);
            const rowKey = `${row.battery_life_id}-${row.battery_id}`;
            return (
              <article
                key={rowKey}
                className={`battery-life-item-row${isDraft && !mockData ? " battery-life-item-row--draft" : ""}`}
              >
                <div className="battery-life-items-table__col battery-life-items-table__col--photo">
                  {hasPhoto ? (
                    <img
                      className="battery-life-item-row__thumb"
                      src={photoSrcUrl}
                      alt=""
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = fallbackImageUrl();
                      }}
                    />
                  ) : (
                    <div className="battery-life-item-row__thumb battery-life-item-row__thumb--empty">
                      —
                    </div>
                  )}
                </div>
                <div className="battery-life-items-table__col battery-life-items-table__col--title">
                  <Link
                    to={`/battery/${row.battery_id}`}
                    state={{ battery: row.battery }}
                    className="battery-life-item-row__link"
                  >
                    {row.battery.title}
                  </Link>
                </div>
                <div className="battery-life-items-table__col battery-life-items-table__col--spec">
                  {row.battery.capacity_mah} мА·ч / {row.battery.voltage_v} В
                </div>
                <div className="battery-life-items-table__col battery-life-items-table__col--current">
                  {isDraft && draft && !mockData ? (
                    <Form.Control
                      id={`bl-item-${rowKey}-current`}
                      type="number"
                      min={1}
                      size="sm"
                      className="battery-life-item-row__input"
                      aria-label={`Ток, ${row.battery.title}`}
                      value={draft.current_ma}
                      onChange={(e) =>
                        updateRowDraft(row.battery_id, { current_ma: Number(e.target.value) || 0 })
                      }
                    />
                  ) : (
                    row.current_ma
                  )}
                </div>
                <div className="battery-life-items-table__col battery-life-items-table__col--qty">
                  {isDraft && draft && !mockData ? (
                    <Form.Control
                      id={`bl-item-${rowKey}-qty`}
                      type="number"
                      min={1}
                      size="sm"
                      className="battery-life-item-row__input"
                      aria-label={`Количество, ${row.battery.title}`}
                      value={draft.quantity}
                      onChange={(e) =>
                        updateRowDraft(row.battery_id, { quantity: Number(e.target.value) || 1 })
                      }
                    />
                  ) : (
                    row.quantity
                  )}
                </div>
                <div className="battery-life-items-table__col battery-life-items-table__col--unit battery-life-item-row__result">
                  {(row.runtime_hours ?? 0).toFixed(2)}
                </div>
                <div className="battery-life-items-table__col battery-life-items-table__col--total battery-life-item-row__result">
                  {runtimeTotal.toFixed(2)}
                </div>
                {isDraft && !mockData ? (
                  <div className="battery-life-items-table__col battery-life-items-table__col--actions">
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={busy || lineBusy}
                      onClick={() => handleSaveRow(row.battery_id)}
                    >
                      Сохранить
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
                ) : null}
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
