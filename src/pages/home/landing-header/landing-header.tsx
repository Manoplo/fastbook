import { Link } from "react-router-dom";
import { FastbookLogo } from "@components/fastbook-logo/fastbook-logo";
import { LOGIN_PATH } from "../home.constants";
import "./landing-header.css";

export function LandingHeader() {
  return (
    <header className="landing-header">
      <div className="landing-header__inner landing-container">
        <Link to="/" aria-label="fastbook">
          <FastbookLogo />
        </Link>
        <nav className="landing-header__nav" aria-label="Principal">
          <a className="landing-header__link" href="#ventajas">
            Ventajas
          </a>
          <a className="landing-header__link" href="#precios">
            Precios
          </a>
          <Link
            className="landing-btn landing-btn--primary landing-header__cta"
            to={LOGIN_PATH}
          >
            Acceso empresas
          </Link>
        </nav>
      </div>
    </header>
  );
}
