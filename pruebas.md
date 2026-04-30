# 🧪 Plan de Pruebas: Sentinel Vault

Este documento detalla los pasos necesarios para validar la funcionalidad completa de la aplicación **Sentinel Vault** tras su despliegue.

---

## 🏗️ Fase 1: Entorno y Conectividad

### 1.1 Verificación de API Backend
- **Acción**: Visitar `https://tu-dominio.vercel.app/api/health`.
- **Resultado Esperado**: Visualizar un JSON `{"status": "ok"}`. Esto confirma que el servidor Express en Vercel está operativo.

### 1.2 Conexión de Wallet
- **Acción**: Cargar la dApp y hacer clic en **"Connect Wallet"**.
- **Resultado Esperado**: El modal de ConnectKit debe abrirse. Tras la firma, tu dirección debe aparecer en el Dashboard.
- **Red**: Asegúrate de estar en **Polygon Amoy Testnet**.

---

## 🤖 Fase 2: Inteligencia Artificial (Oráculo de Riesgo)

### 2.1 Análisis de Protocolo en Tiempo Real
- **Acción**: Observar las tarjetas de los protocolos (Aave, Uniswap, etc.) en el Dashboard.
- **Resultado Esperado**:
    - Inicialmente debe aparecer un estado de "Analyzing...".
    - En segundos, debe cambiar a un score numérico (0-100) y una justificación técnica en inglés.
    - **Si falla**: Si aparece "Communication Error", verifica que `GEMINI_API_KEY` esté correctamente configurada en Vercel.

---

## 💰 Fase 3: Operaciones con Vault

### 3.1 Consulta de Principal
- **Acción**: Revisar el balance de "Principal" en cada activo.
- **Resultado Esperado**: Debe reflejar el balance real de tokens (Tokens de prueba como USDC/WETH en Amoy) que tienes en tu wallet.

### 3.2 Simulación de Depósito (Integridad de Contrato)
- **Acción**: Seleccionar un activo (ej. USDC) e intentar depositar una cantidad pequeña.
- **Flujo**:
    1. Click en el activo.
    2. Ingresar cantidad.
    3. Confirmar en Wallet (Aprobación de Token + Depósito).
- **Resultado Esperado**: La transacción debe ser enviada a Polygon Amoy. Tras la confirmación, el balance depositado debe actualizarse en el Dashboard.

### 3.3 Verificación de Capa de Red
- **Acción**: Observar el badge "Network Layer".
- **Resultado Esperado**: Debe mostrar "Amoy Testnet" (o Polygon POS si estás en Mainnet).

---

## 🛡️ Fase 4: Seguridad y Casos de Borde

### 4.1 Cambio de Red
- **Acción**: Cambiar la red de la wallet a Ethereum Mainnet.
- **Resultado Esperado**: La dApp debe detectar que la red no es compatible y mostrar un aviso o cambiar automáticamente si el Bridge/Wagmi lo soporta.

### 4.2 Error de Fondos Insuficientes
- **Acción**: Intentar depositar una cantidad mayor al balance actual.
- **Resultado Esperado**: El botón debe deshabilitarse o la wallet debe dar un error de "Insufficient Funds" antes de enviar la tx.

---

## 📝 Reporte de Resultados
Si encuentras algún error (especialmente errores de `404` en API o `Permission Denied` en contratos), por favor reporta:
1. Navegador utilizado.
2. Error exacto en la consola de desarrollador (F12).
3. Transacción hash (si aplica).
