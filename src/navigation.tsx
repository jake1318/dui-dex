import { Link, useLocation } from "react-router-dom";

export function Navigation() {
  const location = useLocation();

  return (
    <nav className="bg-gray-900 p-4">
      <div className="flex space-x-6">
        <Link
          to="/"
          className={`text-lg ${
            location.pathname === "/"
              ? "text-blue-400 font-bold"
              : "text-gray-300 hover:text-blue-400"
          }`}
        >
          Swap
        </Link>
        <Link
          to="/trade"
          className={`text-lg ${
            location.pathname === "/trade"
              ? "text-blue-400 font-bold"
              : "text-gray-300 hover:text-blue-400"
          }`}
        >
          Trade
        </Link>
      </div>
    </nav>
  );
}
