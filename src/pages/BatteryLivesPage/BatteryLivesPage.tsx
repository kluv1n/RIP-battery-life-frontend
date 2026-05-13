import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner, Table, Button, Form } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchBatteryLifeApplicationsList,
  finishBatteryLifeApplication,
  setListFilters,
} from "../../store/slices/batteryLifeApplicationSlice";
import { ROUTES } from "../../routePaths";
import { applicationStatusLabelEn } from "../../utils/applicationStatusEn";
import "./BatteryLivesPage.css";

export default function BatteryLivesPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isModerator } = useAppSelector((s) => s.user);
  const { list, listLoading, listError, filters, itemMutationLoading } = useAppSelector(
    (s) => s.batteryLifeApplication,
  );
  const [creatorFilter, setCreatorFilter] = useState("");
  const [draftFrom, setDraftFrom] = useState(filters.fromDate);
  const [draftTo, setDraftTo] = useState(filters.toDate);
  const [draftStatus, setDraftStatus] = useState(filters.status);

  useEffect(() => {
    setDraftFrom(filters.fromDate);
    setDraftTo(filters.toDate);
    setDraftStatus(filters.status);
  }, [filters.fromDate, filters.toDate, filters.status]);

  const load = useCallback(() => {
    void dispatch(fetchBatteryLifeApplicationsList());
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.SIGN_IN, { replace: true });
      return;
    }
    load();
    const id = window.setInterval(load, 4000);
    return () => window.clearInterval(id);
  }, [isAuthenticated, navigate, load]);

  const visible = useMemo(() => {
    const q = creatorFilter.trim().toLowerCase();
    if (!q) return list;
    return list.filter((a) => (a.creator_login ?? "").toLowerCase().includes(q));
  }, [list, creatorFilter]);

  const handleApplyFilters = () => {
    dispatch(
      setListFilters({
        fromDate: draftFrom,
        toDate: draftTo,
        status: draftStatus,
      }),
    );
    void dispatch(fetchBatteryLifeApplicationsList());
  };

  const goApp = (id: number) => {
    navigate(`/battery-life/${id}`);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="battery-lives-page">
      <div className="battery-lives-page__inner">
        <h1 className="battery-lives-page__heading">
          {isModerator ? "Заявки (модератор)" : "Мои заявки"}
        </h1>

        <section className="battery-lives-page__filters">
          <div className="battery-lives-page__filter-row">
            <Form.Group className="battery-lives-page__fg">
              <Form.Label>С даты</Form.Label>
              <Form.Control
                type="date"
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="battery-lives-page__fg">
              <Form.Label>По дату</Form.Label>
              <Form.Control type="date" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} />
            </Form.Group>
            <Form.Group className="battery-lives-page__fg">
              <Form.Label>Статус</Form.Label>
              <Form.Select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}>
                <option value="">Все</option>
                <option value="draft">Черновик</option>
                <option value="formed">Сформирована</option>
                <option value="completed">Завершена</option>
                <option value="rejected">Отклонена</option>
              </Form.Select>
            </Form.Group>
            {isModerator ? (
              <Form.Group className="battery-lives-page__fg battery-lives-page__fg--grow">
                <Form.Label>Создатель (на клиенте)</Form.Label>
                <Form.Control
                  type="text"
                  value={creatorFilter}
                  onChange={(e) => setCreatorFilter(e.target.value)}
                  placeholder="Часть логина"
                />
              </Form.Group>
            ) : null}
          </div>
          <Button variant="primary" className="battery-lives-page__apply" onClick={handleApplyFilters}>
            Применить фильтры
          </Button>
        </section>

        {listError ? <div className="battery-lives-page__error">{listError}</div> : null}

        {listLoading && visible.length === 0 ? (
          <div className="battery-lives-page__loader">
            <Spinner animation="border" />
          </div>
        ) : null}

        <div className="battery-lives-page__table-wrap">
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>Статус</th>
                <th>Создатель</th>
                <th>Создана</th>
                <th>Формирование</th>
                <th>Завершение</th>
                <th>Модератор</th>
                {isModerator ? <th>Действия</th> : null}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const id = row.battery_life_id;
                const finKey = `finish-${id}`;
                const finBusy = Boolean(itemMutationLoading[finKey]);
                return (
                  <tr key={id}>
                    <td>
                      <button type="button" className="battery-lives-page__linkish" onClick={() => goApp(id)}>
                        {id}
                      </button>
                    </td>
                    <td>{applicationStatusLabelEn(row.status)}</td>
                    <td>{row.creator_login ?? "—"}</td>
                    <td>
                      {row.created_at ? new Date(row.created_at).toLocaleString("ru-RU") : "—"}
                    </td>
                    <td>
                      {row.forming_date
                        ? new Date(row.forming_date).toLocaleDateString("ru-RU")
                        : "—"}
                    </td>
                    <td>
                      {row.finish_date
                        ? new Date(row.finish_date).toLocaleString("ru-RU")
                        : "—"}
                    </td>
                    <td>{row.moderator_login ?? "—"}</td>
                    {isModerator ? (
                      <td>
                        {row.status === "formed" ? (
                          <div className="battery-lives-page__actions">
                            <Button
                              size="sm"
                              variant="success"
                              disabled={finBusy}
                              onClick={() =>
                                void dispatch(
                                  finishBatteryLifeApplication({
                                    applicationId: id,
                                    status: "completed",
                                  }),
                                )
                              }
                            >
                              Завершить
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              disabled={finBusy}
                              onClick={() =>
                                void dispatch(
                                  finishBatteryLifeApplication({
                                    applicationId: id,
                                    status: "rejected",
                                  }),
                                )
                              }
                            >
                              Отклонить
                            </Button>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>

        {!listLoading && visible.length === 0 ? (
          <p className="battery-lives-page__empty">Нет заявок по текущим условиям.</p>
        ) : null}
      </div>
    </div>
  );
}
