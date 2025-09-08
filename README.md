# Lékárnet — Public mirror

Tento repozitář je **veřejný mirror** privátního projektu. Obsahuje pouze bezpečné části kódu (bez .env, přístupových údajů a build výstupů).

## Struktura
- ackend/ — Node.js API (MongoDB, autentizace, port 5000).
- src/, public/ — React frontend (Create React App).

## Lokální spuštění
### Backend
cd backend
npm install
# vytvoř .env podle backend/.env.example
npm start

### Frontend (kořen repa)
npm install
# vytvoř .env podle .env.example
npm start
