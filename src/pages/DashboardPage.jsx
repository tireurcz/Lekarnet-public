import React from 'react';
import AdminDashboardPage from './AdminDashboardPage';
import UserDashboardPage from './UserDashboardPage';

const DashboardPage = () => {
  const role = localStorage.getItem('userRole');

  if (!role) {
    return (
      <div>
        <h2>Chyba</h2>
        <p>Role nebyla nalezena. Přihlaste se znovu.</p>
      </div>
    );
  }

  return (
    <>
      {role === 'admin' ? <AdminDashboardPage /> : <UserDashboardPage />}
    </>
  );
};

export default DashboardPage;
