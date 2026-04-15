import { Link } from "react-router-dom";

/** Как в templates/battery_life.html — только header-center, без тулбара */
export default function BatteryLifeHeader() {
  return (
    <header className="header-center">
      <Link to="/" className="header-logo" aria-label="На главную">
        <img src="/img/logo.svg" alt="НЭТЕР" className="header-logo__img" />
      </Link>
    </header>
  );
}
