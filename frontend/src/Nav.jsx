import { Link, useLocation } from "react-router-dom";

function Nav() {
  const location = useLocation();

  return (
    <nav className="nav">
      <Link
        to="/"
        className={location.pathname === "/" ? "nav-link active" : "nav-link"}
      >
        타이머
      </Link>
      <Link
        to="/history"
        className={
          location.pathname === "/history" ? "nav-link active" : "nav-link"
        }
      >
        히스토리
      </Link>
      <Link
        to="/dashboard"
        className={
          location.pathname === "/dashboard" ? "nav-link active" : "nav-link"
        }
      >
        대시보드
      </Link>
    </nav>
  );
}

export default Nav;
