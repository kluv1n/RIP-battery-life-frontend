import { useEffect, useState } from "react";
import CatalogChrome from "../../components/CatalogChrome/CatalogChrome";
import ServicesFilterBar from "../../components/ServicesFilterBar/ServicesFilterBar";
import ServicesList from "../../components/ServicesList/ServicesList";
import type { BatteryServiceMock } from "../../modules/batteryApi";
import { BATTERIES_MOCK, filterMockBatteries, type BatteryFilters } from "../../modules/mock";
import { batteryTypesService } from "../../services";

const initialFilters = (): BatteryFilters => ({ title: "" });

export default function ServicesPage() {
  const [batteries, setBatteries] = useState<BatteryServiceMock[]>(BATTERIES_MOCK);
  const [filters, setFilters] = useState<BatteryFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [useMock, setUseMock] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const remote = await batteryTypesService.list();
      if (cancelled) return;
      if (remote.length > 0) {
        setBatteries(remote);
        setUseMock(false);
      } else {
        setBatteries(BATTERIES_MOCK);
        setUseMock(true);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyFilters = async () => {
    setLoading(true);
    try {
      const remote = await batteryTypesService.list({ title: filters.title });
      if (remote.length > 0) {
        setBatteries(remote);
        setUseMock(false);
      } else if (useMock) {
        setBatteries(filterMockBatteries(filters));
      } else {
        setBatteries([]);
      }
    } catch {
      setBatteries(filterMockBatteries(filters));
      setUseMock(true);
    } finally {
      setLoading(false);
    }
  };

  const toolbarForm = (
    <ServicesFilterBar
      query={filters.title}
      onQueryChange={(q) => setFilters((f) => ({ ...f, title: q }))}
      onSearch={applyFilters}
    />
  );

  return (
    <>
      <CatalogChrome toolbarForm={toolbarForm} />
      <div className="space">
        <h2 className="section-title">Типы аккумуляторов</h2>
        {loading ? (
          <p style={{ color: "var(--neter-text-muted)" }}>Загрузка…</p>
        ) : batteries.length > 0 ? (
          <ServicesList batteries={batteries} />
        ) : (
          <p style={{ color: "var(--neter-text-muted)" }}>По заданным фильтрам услуги не найдены.</p>
        )}
      </div>
    </>
  );
}
