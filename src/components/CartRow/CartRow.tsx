import { useEffect, useState } from "react";
import { getBatteryLifeCart, type BatteryLifeCartJSON } from "../../modules/batteryApi";

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

/** Гость: GET корзины для Network/счётчика; переход в заявку по клику отключён. */
export default function CartRow() {
  const [cart, setCart] = useState<BatteryLifeCartJSON | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getBatteryLifeCart().then((c) => {
      if (!cancelled) setCart(c);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const countLabel = cart != null && cart.items_count > 0 ? String(cart.items_count) : "";

  return (
    <span
      className="cart-button cart-button--disabled"
      aria-label={
        countLabel
          ? `Shopping cart, ${countLabel} items — sign in to open the draft (guests cannot open the cart)`
          : "Shopping cart — sign in to view or add items (guests cannot open the cart)"
      }
    >
      <CartIcon />
      <span className="cart-button__label">{countLabel}</span>
    </span>
  );
}
