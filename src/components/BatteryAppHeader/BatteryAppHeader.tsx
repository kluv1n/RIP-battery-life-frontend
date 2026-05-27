import { Link } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logoutUser } from "../../store/slices/userSlice";
import { ROUTES } from "../../routePaths";
import "./BatteryAppHeader.css";

export default function BatteryAppHeader() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, username } = useAppSelector((s) => s.user);
  const cart = useAppSelector((s) => s.batteryLifeApplication.cart);

  const handleLogout = () => {
    void dispatch(logoutUser());
  };

  const draftNavActive = Boolean(cart?.id != null && cart.items_count > 0);

  return (
    <header className="battery-app-header-wrap">
      <Navbar
        expand="lg"
        collapseOnSelect
        variant="dark"
        className="battery-navbar py-0"
        data-bs-theme="dark"
      >
        <Container fluid className="battery-navbar__bar position-relative">
          <Navbar.Toggle aria-controls="battery-main-nav" className="battery-navbar__toggle" />
          <Navbar.Brand
            as={Link}
            to={ROUTES.SERVICES}
            className="battery-navbar__brand-center position-absolute start-50 mx-0 py-2"
            aria-label="На главную"
          >
            <img
              src={`${import.meta.env.BASE_URL}img/logo.svg`}
              alt="НЭТЕР"
              className="header-logo__img"
            />
          </Navbar.Brand>
          <Navbar.Collapse id="battery-main-nav" className="battery-navbar__collapse justify-content-lg-end">
            <Nav className="battery-navbar__nav ms-lg-auto" navbar>
              <Nav.Link as={Link} to={ROUTES.SERVICES} className="battery-nav-link" eventKey="catalog">
                Каталог типов АКБ
              </Nav.Link>
              {isAuthenticated ? (
                <>
                  <Nav.Link
                    as={Link}
                    to={ROUTES.BATTERY_LIVES}
                    className="battery-nav-link"
                    eventKey="lives"
                  >
                    Заявки
                  </Nav.Link>
                  <Nav.Link as={Link} to={ROUTES.PROFILE} className="battery-nav-link" eventKey="profile">
                    Личный кабинет
                  </Nav.Link>
                </>
              ) : null}
              {draftNavActive && cart?.id != null ? (
                <Nav.Link
                  as={Link}
                  to={`/battery-life/${cart.id}`}
                  className="battery-nav-link"
                  eventKey="draft"
                >
                  Текущая заявка
                </Nav.Link>
              ) : (
                <Nav.Link className="battery-nav-link battery-nav-link--muted" eventKey="draft-off" disabled>
                  Текущая заявка
                </Nav.Link>
              )}
              {isAuthenticated ? (
                <>
                  <Nav.Link
                    as={Link}
                    to={ROUTES.SERVICES}
                    className="battery-nav-link"
                    eventKey="logout"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLogout();
                    }}
                  >
                    Выход
                  </Nav.Link>
                  <span className="battery-navbar__username d-none d-lg-inline">{username}</span>
                </>
              ) : (
                <>
                  <Nav.Link as={Link} to={ROUTES.SIGN_IN} className="battery-nav-link" eventKey="signin">
                    Вход
                  </Nav.Link>
                  <Nav.Link as={Link} to={ROUTES.SIGN_UP} className="battery-nav-link" eventKey="signup">
                    Регистрация
                  </Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
}
