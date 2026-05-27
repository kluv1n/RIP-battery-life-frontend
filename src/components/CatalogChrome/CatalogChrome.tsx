import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import CartRow from "../CartRow/CartRow";

/** Шапка + тулбар. При `embedInLayout` шапку не рисуем — её даёт `BatteryAppHeader`. */
export default function CatalogChrome({
  toolbarForm,
  toolbarLeading,
  embedInLayout,
}: {
  /** Центр тулбара (поиск). На деталке карточки не передаём. */
  toolbarForm?: ReactNode;
  /** Слева (напр. поиск по фото); опционально. */
  toolbarLeading?: ReactNode;
  embedInLayout?: boolean;
}) {
  return (
    <>
      {embedInLayout ? null : (
        <header>
          <Link to="/" className="header-logo" aria-label="Home">
            <img
              src={`${import.meta.env.BASE_URL}img/logo.svg`}
              alt="НЭТЕР"
              className="header-logo__img"
            />
          </Link>
        </header>
      )}
      <div className="toolbar toolbar--catalog">
        <div className="toolbar__catalog-left">{toolbarLeading ?? null}</div>
        {toolbarForm ? <div className="toolbar__catalog-center">{toolbarForm}</div> : null}
        <div className="cart-wrap cart-wrap--catalog-end">
          <CartRow />
        </div>
      </div>
    </>
  );
}
