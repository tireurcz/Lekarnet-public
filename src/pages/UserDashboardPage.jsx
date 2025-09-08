// src/pages/UserDashboardPage.jsx
import React from "react";
import TasksWidget from "../components/TasksWidget";

const UserDashboardPage = () => {
  // Pomocný log pro ověření, že se renderuje správná stránka:
  console.log("[UserDashboardPage] render");

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 text-blue-800" data-page="user-dashboard">
      {/* Levý (hlavní) obsah */}
      <div className="xl:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl shadow p-6 border">
          <h2 className="text-xl font-bold mb-4">Uživatelský přehled</h2>
          <p>Vítejte! Zde můžete sledovat svou aktivitu, nastavení a další funkce.</p>
        </div>
        {/* případné další boxy/statistiky… */}
      </div>

      {/* Pravý sloupec – Dnešní / Nejbližší úkoly */}
      <TasksWidget />
    </div>
  );
};

export default UserDashboardPage;
