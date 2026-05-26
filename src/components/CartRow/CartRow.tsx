import { Link } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";

function CartIcon() {
  return (
    <svg className="cart-row__icon" viewBox="0 0 24 24" aria-hidden="true">
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

/** Как в new_front `CartRow`: счётчик + ссылка на черновик при наличии позиций. */
export default function CartRow({ className = "" }: { className?: string }) {
  const { isAuthenticated } = useAppSelector((s) => s.user);
  const cart = useAppSelector((s) => s.batteryLifeApplication.cart);

  const count = cart?.items_count ?? 0;
  const hasDraft = Boolean(isAuthenticated && cart?.id != null && count > 0);

  const inner = (
    <>
      <CartIcon />
      <span className="cart-row__text">Типов в заявке: {count}</span>
    </>
  );

  const rootClass = ["cart-row", className].filter(Boolean).join(" ");

  if (hasDraft && cart?.id != null) {
    return (
      <div className={rootClass}>
        <Link to={`/battery-life/${cart.id}`} className="cart-row__link">
          {inner}
        </Link>
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <div className="cart-row__inactive">{inner}</div>
    </div>
  );
}
