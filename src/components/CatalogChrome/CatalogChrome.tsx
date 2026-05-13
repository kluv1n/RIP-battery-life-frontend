import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import CartRow from "../CartRow/CartRow";

/** Шапка + тулбар. При `embedInLayout` шапку не рисуем — её даёт `BatteryAppHeader`. */
export default function CatalogChrome({
  toolbarForm,
  toolbarLeading,
  embedInLayout,
}: {
  toolbarForm: ReactNode;
  /** Слева (напр. поиск по фото); опционально. */
  toolbarLeading?: ReactNode;
  embedInLayout?: boolean;
}) {
  return (
    <>
      {embedInLayout ? null : (
        <header>
          <Link to="/" className="header-logo" aria-label="Home">
            <img src="/img/logo.svg" alt="НЭТЕР" className="header-logo__img" />
          </Link>
        </header>
      )}
      <div className="toolbar toolbar--catalog">
        <div className="toolbar__catalog-left">{toolbarLeading ?? null}</div>
        <div className="toolbar__catalog-center">{toolbarForm}</div>
        <div className="cart-wrap cart-wrap--catalog-end">
          <CartRow />
        </div>
      </div>
    </>
  );
}
