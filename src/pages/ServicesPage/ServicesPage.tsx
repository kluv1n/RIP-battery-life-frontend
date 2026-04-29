import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, ProgressBar, Spinner } from "react-bootstrap";
import CatalogChrome from "../../components/CatalogChrome/CatalogChrome";
import ServicesFilterBar from "../../components/ServicesFilterBar/ServicesFilterBar";
import ServicesList from "../../components/ServicesList/ServicesList";
import { useBatteryImageSearch } from "../../hooks/useBatteryImageSearch";
import {
  batteryClipDescription,
  fallbackImageUrl,
  listBatteryTypes,
  resolveMediaUrl,
  type BatteryServiceMock,
} from "../../modules/batteryApi";
import { BATTERIES_MOCK, filterMockBatteries, type BatteryFilters } from "../../modules/mock";
import "./ServicesPage.css";

const initialFilters = (): BatteryFilters => ({ title: "" });

export default function ServicesPage() {
  const [sourceBatteries, setSourceBatteries] = useState<BatteryServiceMock[]>(BATTERIES_MOCK);
  const [batteries, setBatteries] = useState<BatteryServiceMock[]>(BATTERIES_MOCK);
  const [filters, setFilters] = useState<BatteryFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [useMock, setUseMock] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [clipSessionActive, setClipSessionActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const remote = await listBatteryTypes();
      if (cancelled) return;
      if (remote.length > 0) {
        setSourceBatteries(remote);
        setBatteries(remote);
        setUseMock(false);
      } else {
        setSourceBatteries(BATTERIES_MOCK);
        setBatteries(BATTERIES_MOCK);
        setUseMock(true);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const clipItems = useMemo(
    () =>
      sourceBatteries.map((b) => ({
        id: b.battery_id,
        description: batteryClipDescription(b),
      })),
    [sourceBatteries],
  );

  const {
    items: clipProcessed,
    ready: clipReady,
    progress: clipProgress,
    imageEmbedding,
    workerError,
    searchByImage,
    resetSearch,
  } = useBatteryImageSearch(clipItems, clipSessionActive);

  const batteryById = useMemo(() => {
    const m = new Map<number, BatteryServiceMock>();
    sourceBatteries.forEach((b) => m.set(b.battery_id, b));
    return m;
  }, [sourceBatteries]);

  const applyFilters = async () => {
    setLoading(true);
    try {
      const remote = await listBatteryTypes({ title: filters.title });
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

  const handleUploadButtonClick = () => {
    if (!clipSessionActive) setClipSessionActive(true);
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (selectedImage?.startsWith("blob:")) URL.revokeObjectURL(selectedImage);
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    searchByImage(file);
  };

  const handleClearImage = () => {
    if (selectedImage?.startsWith("blob:")) URL.revokeObjectURL(selectedImage);
    setSelectedImage(null);
    resetSearch();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toolbarForm = (
    <ServicesFilterBar
      query={filters.title}
      onQueryChange={(q) => setFilters((f) => ({ ...f, title: q }))}
      onSearch={applyFilters}
    />
  );

  const imageSearchActive = Boolean(imageEmbedding);
  const showClipProgress = clipSessionActive && clipItems.length > 0 && !clipReady && !workerError;
  const uploadLabel = clipSessionActive && !clipReady ? "Загрузка нейросети..." : "Загрузить фото";
  const isUploadDisabled = clipItems.length === 0 || (clipSessionActive && !clipReady);
  const visibleClipRows = imageSearchActive ? clipProcessed.filter((item) => item.isVisible) : [];

  return (
    <>
      <CatalogChrome toolbarForm={toolbarForm} />
      <div className="space">
        <section className="clip-search" aria-labelledby="clip-search-title">
          <h3 id="clip-search-title" className="clip-search__title">
            Поиск похожих аккумуляторов по фото (CLIP)
          </h3>
          {workerError ? <Alert variant="warning">Ошибка CLIP: {workerError}</Alert> : null}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="clip-search__input"
            onChange={handleImageUpload}
          />
          <div className="clip-search__controls">
            <button
              type="button"
              className="cart-button clip-search__btn"
              onClick={handleUploadButtonClick}
              disabled={isUploadDisabled}
            >
              {uploadLabel}
            </button>
            <Button
              type="button"
              variant="outline-secondary"
              className="clip-search__btn clip-search__btn--secondary"
              onClick={handleClearImage}
              disabled={!selectedImage}
            >
              Сбросить
            </Button>
          </div>
          {showClipProgress ? (
            <ProgressBar
              className="clip-search__progress"
              now={clipProgress}
              label={`${Math.round(clipProgress)}%`}
              animated
            />
          ) : null}
          {selectedImage ? (
            <img className="clip-search__preview" src={selectedImage} alt="Загруженное изображение для поиска" />
          ) : null}
        </section>

        <h2 className="section-title">Типы аккумуляторов</h2>
        {loading ? (
          <div className="services-loading">
            <Spinner animation="border" role="status" aria-label="Загрузка" />
          </div>
        ) : imageSearchActive ? (
          <ul className="clip-results-list">
            {visibleClipRows.map((item) => {
              const battery = batteryById.get(item.id);
              if (!battery) return null;
              return (
                <li key={item.id} className="clip-results-list__item">
                  <img src={resolveMediaUrl(battery.photo_url) || fallbackImageUrl()} alt="" />
                  <div>
                    <strong>{battery.title}</strong>
                    <p>{item.description}</p>
                    <p>Сходство: {(item.score * 100).toFixed(1)}%</p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : batteries.length > 0 ? (
          <ServicesList batteries={batteries} />
        ) : (
          <p style={{ color: "var(--neter-text-muted)" }}>По заданным фильтрам услуги не найдены.</p>
        )}
      </div>
    </>
  );
}
