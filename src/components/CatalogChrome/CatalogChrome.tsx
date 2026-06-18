import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/** Шапка + тулбар как в templates/index.html: поиск по тексту, по фото и корзина в одной строке. */
export default function CatalogChrome({ toolbar }: { toolbar: ReactNode }) {
  return (
    <>
      <header>
        <Link to="/" className="header-logo" aria-label="На главную">
          <img src="/img/logo.svg" alt="НЭТЕР" className="header-logo__img" />
        </Link>
      </header>
      <div className="toolbar toolbar--catalog-unified">{toolbar}</div>
    </>
  );
}
