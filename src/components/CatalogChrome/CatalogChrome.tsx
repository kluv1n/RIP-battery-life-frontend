import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import CartRow from "../CartRow/CartRow";

/** Шапка + тулбар как в templates/index.html и templates/battery.html */
export default function CatalogChrome({ toolbarForm }: { toolbarForm: ReactNode }) {
  return (
    <>
      <header>
        <Link to="/" className="header-logo" aria-label="На главную">
          <img src="/img/logo.svg" alt="НЭТЕР" className="header-logo__img" />
        </Link>
      </header>
      <div className="toolbar">
        {toolbarForm}
        <div className="cart-wrap">
          <CartRow />
        </div>
      </div>
    </>
  );
}
