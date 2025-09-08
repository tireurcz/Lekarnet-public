import React from "react";
import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // vyčistit uložená data
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");

    // přesměrovat na domovskou / login
    navigate("/", { replace: true });
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition"
    >
      🚪 Odhlásit se
    </button>
  );
}
