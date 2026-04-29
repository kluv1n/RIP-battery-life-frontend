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

/** Гость: иконка корзины видна, но переход в заявку отключён. */
export default function CartRow() {
  return (
    <span className="cart-button cart-button--disabled" aria-label="Гостю недоступен переход в заявку">
      <CartIcon />
      <span className="cart-button__label"></span>
    </span>
  );
}
