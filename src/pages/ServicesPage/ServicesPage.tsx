import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, ProgressBar, Spinner } from "react-bootstrap";
import CatalogChrome from "../../components/CatalogChrome/CatalogChrome";
import ServicesFilterBar from "../../components/ServicesFilterBar/ServicesFilterBar";
import ServicesList from "../../components/ServicesList/ServicesList";
import { useBatteryImageSearch } from "../../hooks/useBatteryImageSearch";
import {
  batteryClipDescription,
  listBatteryTypes,
  type BatteryServiceMock,
} from "../../modules/batteryApi";
import { BATTERIES_MOCK, filterMockBatteries } from "../../modules/mock";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setCatalogTitleFilter } from "../../store/slices/catalogFiltersSlice";
import "./ServicesPage.css";

export default function ServicesPage() {
  const dispatch = useAppDispatch();
  const titleFilter = useAppSelector((s) => s.catalogFilters.title);
  const isAuthenticated = useAppSelector((s) => s.user.isAuthenticated);
  const [sourceBatteries, setSourceBatteries] = useState<BatteryServiceMock[]>(BATTERIES_MOCK);
  const [loading, setLoading] = useState(true);
  const [useMock, setUseMock] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [clipSessionActive, setClipSessionActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Один запрос при открытии каталога (без дубля из applyFilters + StrictMode). */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      try {
        const remote = await listBatteryTypes();
        if (cancelled) return;
        if (remote.length > 0) {
          setSourceBatteries(remote);
          setUseMock(false);
        } else {
          setSourceBatteries(BATTERIES_MOCK);
          setUseMock(true);
        }
      } catch {
        if (cancelled) return;
        setSourceBatteries(BATTERIES_MOCK);
        setUseMock(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Фильтр по теме — на клиенте; к API только по кнопке «Search». */
  const batteries = useMemo(() => {
    if (useMock || import.meta.env.VITE_GUEST_APP === "true") {
      return filterMockBatteries({ title: titleFilter });
    }
    const t = titleFilter.trim().toLowerCase();
    if (!t) return sourceBatteries;
    return sourceBatteries.filter(
      (b) =>
        b.title.toLowerCase().includes(t) ||
        b.short_description.toLowerCase().includes(t) ||
        b.description.toLowerCase().includes(t),
    );
  }, [sourceBatteries, titleFilter, useMock]);

  const runServerSearch = useCallback(async () => {
    if (useMock || import.meta.env.VITE_GUEST_APP === "true") return;
    setLoading(true);
    try {
      const remote = await listBatteryTypes(
        titleFilter.trim() ? { title: titleFilter.trim() } : undefined,
      );
      if (remote.length > 0) {
        setSourceBatteries(remote);
        setUseMock(false);
      } else if (!titleFilter.trim()) {
        setSourceBatteries([]);
      }
    } catch {
      setSourceBatteries(BATTERIES_MOCK);
      setUseMock(true);
    } finally {
      setLoading(false);
    }
  }, [titleFilter, useMock]);

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

  const prevAuthRef = useRef(isAuthenticated);

  useEffect(() => {
    const wasAuth = prevAuthRef.current;
    prevAuthRef.current = isAuthenticated;
    if (wasAuth && !isAuthenticated) {
      setSelectedImage((img) => {
        if (img?.startsWith("blob:")) URL.revokeObjectURL(img);
        return null;
      });
      setClipSessionActive(false);
      resetSearch();
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [isAuthenticated, resetSearch]);

  const batteryById = useMemo(() => {
    const m = new Map<number, BatteryServiceMock>();
    sourceBatteries.forEach((b) => m.set(b.battery_id, b));
    return m;
  }, [sourceBatteries]);

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

  const imageSearchActive = Boolean(imageEmbedding);
  const showClipProgress = clipSessionActive && clipItems.length > 0 && !clipReady && !workerError;
  const uploadLabel = clipSessionActive && !clipReady ? "Loading model…" : "Upload photo";
  const isUploadDisabled = clipItems.length === 0 || (clipSessionActive && !clipReady);
  const visibleClipRows = imageSearchActive ? clipProcessed.filter((item) => item.isVisible) : [];

  const clipScoresMap = useMemo(() => {
    if (!imageSearchActive) return undefined;
    const m = new Map<number, number>();
    for (const row of visibleClipRows) m.set(row.id, row.score);
    return m;
  }, [imageSearchActive, visibleClipRows]);

  const displayBatteries = useMemo(() => {
    if (!imageSearchActive) return batteries;
    return visibleClipRows
      .map((row) => batteryById.get(row.id))
      .filter((b): b is BatteryServiceMock => b != null);
  }, [imageSearchActive, batteries, visibleClipRows, batteryById]);

  const toolbarLeading = (
    <div className="catalog-photo-search" aria-label="Search similar batteries by photo">
      <input
        id="catalog-photo-upload"
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="catalog-toolbar-row__file-input"
        aria-label="Загрузить фото для поиска"
        onChange={handleImageUpload}
      />
      <button
        type="button"
        className="cart-button"
        onClick={handleUploadButtonClick}
        disabled={isUploadDisabled}
      >
        {uploadLabel}
      </button>
      <Button
        type="button"
        variant="outline-secondary"
        className="catalog-toolbar-row__btn-secondary"
        onClick={handleClearImage}
        disabled={!selectedImage}
      >
        Reset
      </Button>
      {showClipProgress ? (
        <ProgressBar
          className="catalog-toolbar-row__progress"
          now={clipProgress}
          label={`${Math.round(clipProgress)}%`}
          animated
        />
      ) : null}
      {selectedImage ? (
        <img className="catalog-toolbar-row__thumb" src={selectedImage} alt="Uploaded query image" />
      ) : null}
    </div>
  );

  const toolbarForm = (
    <ServicesFilterBar
      query={titleFilter}
      onQueryChange={(q) => dispatch(setCatalogTitleFilter(q))}
      onSearch={() => void runServerSearch()}
    />
  );

  const emptyMessage = imageSearchActive
    ? "No battery types loaded for photo search."
    : "No battery types match the current filters.";

  return (
    <>
      <CatalogChrome embedInLayout toolbarLeading={toolbarLeading} toolbarForm={toolbarForm} />
      <div className="space">
        {workerError ? <Alert variant="warning">Photo search error: {workerError}</Alert> : null}
        <h2 className="section-title">Battery types</h2>
        {loading ? (
          <div className="services-loading">
            <Spinner animation="border" role="status" aria-label="Loading" />
          </div>
        ) : displayBatteries.length > 0 ? (
          <ServicesList batteries={displayBatteries} clipScores={clipScoresMap} />
        ) : (
          <p style={{ color: "var(--neter-text-muted)" }}>{emptyMessage}</p>
        )}
      </div>
    </>
  );
}
