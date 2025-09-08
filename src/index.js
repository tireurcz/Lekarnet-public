// src/index.js (CRA)
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App"; // <-- DŮLEŽITÉ: bez přípony, načte App.js

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  // necháme bez StrictMode (v devu kvůli efektům/guardu klidnější)
  <App />
);
