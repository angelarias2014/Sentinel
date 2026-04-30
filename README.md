# 🛡️ Sentinel Vault: AI-Powered DeFi Risk Management

**Sentinel Vault** es una infraestructura de vanguardia diseñada para la protección de activos en el ecosistema DeFi. Utiliza Inteligencia Artificial generativa (Google Gemini) para actuar como un oráculo de riesgo dinámico, protegiendo los depósitos de los usuarios ante volatilidades extremas o fallos en los protocolos subyacentes.

---

## 🌟 Vision y Propósito
En el panorama DeFi actual, los riesgos de mercado (desanclaje de stablecoins, exploits de liquidez, caídas del 99%) ocurren en minutos. Los modelos de riesgo tradicionales son estáticos. **Sentinel Vault** introduce una capa reactiva que:
1.  **Analiza** datos del mercado en tiempo real mediante IA.
2.  **Anticipa** crisis antes de que afecten el capital.
3.  **Ejecuta** defensas on-chain (Safe Withdraw) automáticamente.

---

## 🚀 Características Principales
-   **AI Risk Oracle**: Motor basado en Gemini 1.5 que procesa feeds de datos y emite scores de riesgo (0-100).
-   **Automated Emergency Shield**: Si el riesgo > 80, el contrato retira automáticamente los activos del yield-source y los resguarda en el Vault.
-   **Multi-Asset Treasury**: Gestión centralizada de yields y fees para sostenibilidad del protocolo.
-   **Dashboard en Tiempo Real**: Visualización de métricas de riesgo, balances y estado de la red Base Sepolia.
-   **Gas Optimized**: Contratos escritos con patrones de optimización de gas (Custom Errors, slot packing).

---

## 🛠️ Stack Tecnológico
-   **Smart Contracts**: Solidity 0.8.24, Hardhat/Foundry, OpenZeppelin.
-   **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons.
-   **Web3**: Wagmi v2, Viem, ConnectKit.
-   **Backend/Oracle**: Express.js, TypeScript, Google Generative AI SDK (@google/genai).

---

## 💻 Guía de Implementación Local

### 1. Requisitos Técnicos
-   **Node.js**: v18.0.0 o superior.
-   **Wallet**: Metamask o similar con configuración para **Base Sepolia**.
-   **Faucet**: Obtén tokens de prueba en [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet).

### 2. Instalación
```bash
# Clonar repositorio
git clone <repo-url>
cd sentinel-vault

# Instalar dependencias
npm install
```

### 3. Configuración de Entorno
Crea un archivo `.env` en la raíz del proyecto. **Es obligatorio** contar con una API Key de Gemini:
```env
# Claves de IA (Google Gemini)
GEMINI_API_KEY=""
VITE_GEMINI_API_KEY=""

# Configuración de Oráculo
ORACLE_PRIVATE_KEY=""
VITE_ADMIN_ADDRESS="0x0000..."

# Web3 / Conectividad
VITE_WALLETCONNECT_PROJECT_ID=""
```

### 4. Ejecución
```bash
# Iniciar servidor Full-Stack (Frontend + Backend API)
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

---

## ☁️ Despliegue en Vercel (Front + Back)

Vercel permite desplegar Sentinel Vault de forma robusta. Al ser una aplicación Full-Stack (Vite + Express), utilizamos las funciones Serverless de Vercel para el Oráculo de IA.

### Paso 1: Preparación del Repositorio
Asegúrate de que el archivo `vercel.json` esté en la raíz para direccionar correctamente las rutas del API al servidor Express.

### Paso 2: Importar en Vercel
1.  Ve a [Vercel Dashboard](https://vercel.com/dashboard) y haz clic en **Add New** > **Project**.
2.  Importa tu repositorio de GitHub.

### Paso 3: Configuración de Variables de Entorno (DETALLE ALTO)
Este es el paso más crítico. En la pestaña **Environment Variables**, añade:

| Variable | Descripción | Valor Ejemplo |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Clave secreta de Google AI Studio | `AIzaSy...` |
| `VITE_BASE_RPC_URL` | RPC para Base Mainnet | `https://mainnet.base.org` |
| `VITE_BASE_SEPOLIA_RPC_URL` | RPC para Base Sepolia | `https://sepolia.base.org` |
| `DEPLOYER_PRIVATE_KEY` | Key para interactuar con contratos (opcional en front) | `0x...` |
| `VITE_BASE_SEPOLIA_FACTORY_ADDRESS` | Dirección del Vault Factory (Base Sepolia) | `0xEC8B2c8f60DDe002349d85d51E218FC51DCe2a20` |
| `VITE_BASE_SEPOLIA_TREASURY_ADDRESS` | Dirección del Treasury (Base Sepolia) | `0xA8A722f3E802b453599Ca23EC0e674C3015990BD` |
| `VITE_BASE_SEPOLIA_ORACLE_ADDRESS` | Dirección del Oráculo (Base Sepolia) | `0x8eD545Cc30f9e0cEA0AB913d233934EaC80dfFc5` |
| `VITE_BASE_AAVE_V3_POOL` | Dirección de Aave V3 Pool (Base) | `0x...` |
| `VITE_BASE_AERODROME_ROUTER` | Dirección de Aerodrome Router (Base) | `0x...` |
| `VITE_BASE_MOONWELL_COMPTROLLER` | Dirección de Moonwell Comptroller (Base) | `0x...` |
| `VITE_BASE_MORPHO` | Dirección de Morpho (Base) | `0x...` |

**Nota**: Las variables que empiezan por `VITE_` son accesibles desde el navegador. La `GEMINI_API_KEY` **NUNCA** debe llevar el prefijo `VITE_` para mantenerse segura en el servidor.

### Paso 4: Configuración de Build
-   **Framework Preset**: Other (Vercel detectará el archivo `vercel.json`).
-   **Root Directory**: `./`.
-   **Output Directory**: `dist`.

### Paso 5: Despliegue y Validación
Haz clic en **Deploy**. Una vez finalizado, verifica la salud de la API visitando `https://tu-app.vercel.app/api/health`. Deberías recibir `{"status": "ok"}`.

---

## 📂 Estructura del Proyecto
```text
├── contracts/          # Contratos de Solidity (Vault, Treasury, Factory)
├── scripts/            # Scripts de despliegue en Base Sepolia
├── src/                # Código fuente del Frontend
│   ├── components/     # Componentes de UI (Cards, Modals, Layout)
│   ├── lib/            # ABIs, Direcciones y Utilidades
│   └── main.tsx        # Punto de entrada React
├── server.ts           # Backend Express / AI Risk Oracle
├── arquitectura.md     # Documentación técnica profunda
└── vercel.json         # Configuración para despliegue en la nube
```

---

## 🛡️ Seguridad
Sentinel Vault ha sido diseñado bajo los principios de **Trustless AI**:
-   Las actualizaciones de riesgo están firmadas.
-   Solo el rol `ORACLE_ROLE` puede modificar el score.
-   El usuario siempre tiene control final sobre sus fondos para retiro manual.

---
© 2024 Sentinel Vault Team | Built for Base ecosystem.
