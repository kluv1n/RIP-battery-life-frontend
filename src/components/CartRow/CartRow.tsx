import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MOCK_CART, subscribeBatteryLifeCart } from "../../modules/mock";

function CartIcon() {
  return (
    <svg className="cart-button__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 4H5L4 6h2l3 9h9l3-7H13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="19" r="1.5" fill="currentColor" />
      <circle cx="17" cy="19" r="1.5" fill="currentColor" />
    </svg>
  );
}

/** Как в templates/index.html: при hasDraft — ссылка, иначе неактивная кнопка */
export default function CartRow() {
  const [cart, setCart] = useState(MOCK_CART);

  useEffect(() => {
    const sync = () => setCart({ ...MOCK_CART });
    sync();
    return subscribeBatteryLifeCart(sync);
  }, []);

  const label = cart.items_count > 0 ? String(cart.items_count) : "";

  if (cart.has_draft && cart.id != null) {
    return (
      <Link to={`/battery-life/${cart.id}`} className="cart-button" aria-label="Текущая заявка">
        <CartIcon />
        <span className="cart-button__label">{label}</span>
      </Link>
    );
  }

  return (
    <span className="cart-button cart-button--disabled" aria-label="Нет черновика заявки">
      <CartIcon />
      <span className="cart-button__label"></span>
    </span>
  );
}
