import React from "react";
import { Link } from "react-router-dom";
import Logo from "../assets/logo.svg"; // cesta k logu

const HomePage = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-100 to-indigo-200">
      <div className="text-center">
        {/* Logo */}
        <img
          src={Logo}
          alt="Lékárnet logo"
          className="mx-auto h-64 w-64 mb-1"
        />

       
        {/* Odkaz na login */}
        <Link
          to="/login"
          className="text-blue-700 font-medium hover:text-blue-900 hover:underline transition"
        >
          Přihlaste se pro přístup do systému.
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
