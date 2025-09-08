// src/pages/AdminDashboardPage.jsx
import React from "react";
import TasksWidget from "../components/TasksWidget";

const AdminDashboardPage = () => {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Levá část s přehledem administrace */}
      <div className="lg:col-span-2 space-y-6 text-blue-800">
        <div className="bg-white rounded-2xl shadow p-6 border">
          <h2 className="text-xl font-bold mb-4">Administrace</h2>
          <ul className="list-disc ml-5 space-y-1">
            <li>Správa uživatelů</li>
            <li>Role a oprávnění</li>
            <li>Logy a statistiky</li>
          </ul>
        </div>
        {/* případně další admin boxy */}
      </div>

      {/* Pravý sloupec: widget s dnešními úkoly */}
      <TasksWidget />
    </div>
  );
};

export default AdminDashboardPage;
