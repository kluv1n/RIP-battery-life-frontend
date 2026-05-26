import { Link, Outlet } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import { ROUTES } from "../routePaths";

/** Tauri / демо гостя: без входа и без редактирования заявки. */
export default function GuestLayout() {
  return (
    <div className="main-layout">
      <header className="battery-app-header-wrap">
        <Navbar expand="lg" collapseOnSelect variant="dark" className="battery-navbar py-0" data-bs-theme="dark">
          <Container fluid className="battery-navbar__bar position-relative">
            <Navbar.Brand
              as={Link}
              to={ROUTES.SERVICES}
              className="battery-navbar__brand-center position-absolute start-50 mx-0 py-2"
            >
              <img src={`${import.meta.env.BASE_URL}img/logo.svg`} alt="НЭТЕР" className="header-logo__img" />
            </Navbar.Brand>
            <Navbar.Collapse className="battery-navbar__collapse justify-content-lg-end">
              <Nav className="battery-navbar__nav ms-lg-auto" navbar>
                <Nav.Link as={Link} to={ROUTES.SERVICES} className="battery-nav-link">
                  Каталог
                </Nav.Link>
                <Nav.Link as={Link} to="/battery-life/1" className="battery-nav-link">
                  Пример заявки
                </Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </header>
      <Outlet />
    </div>
  );
}
