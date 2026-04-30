# 🛡️ Guía de Auditoría con Mythril

Mythril es una herramienta de análisis de seguridad para contratos inteligentes de Ethereum. Utiliza ejecución simbólica y análisis de flujo de control para detectar vulnerabilidades complejas que el análisis estático simple podría pasar por alto.

## 🛠️ Instalación

Mythril requiere Python 3.6 - 3.10.

### Opción 1: Usando pip
```bash
# Se recomienda usar un entorno virtual
pip3 install mythril
```

### Opción 2: Usando Docker (Más estable)
```bash
docker pull christofferqa/mythril
# Ejecutar contra un contrato
docker run -v $(pwd):/tmp mythril/myth analyze /tmp/contracts/SentinelVault.sol
```

---

## 🚀 Uso Básico

Mythril puede analizar archivos `.sol` directamente o contratos ya desplegados.

### Analizar un contrato local
```bash
myth analyze contracts/SentinelVault.sol --solc-json solc-input.json
```

Si usas Hardhat, es mejor compilar primero y apuntar al bytecode o usar el plugin de integración.

### Profundidad de análisis
Por defecto, Mythril realiza 22 pasos de ejecución. Para un análisis más exhaustivo:
```bash
# Aumentar el límite de transacciones (muy útil para DeFi)
myth analyze contracts/SentinelVault.sol --execution-timeout 600 --max-depth 25
```

---

## 🔍 Detectores Clave

Mythril es excelente para encontrar:
1.  **Integer Overflows/Underflows** (aunque Solidity 0.8+ los maneja, es bueno para lógica custom).
2.  **Dependencia de Timestamp:** Crítico en Sentinel Vault si usamos el tiempo para calcular intereses o bloqueos.
3.  **State Reversion Bug:** Encuentra rutas donde el contrato puede quedar bloqueado.
4.  **Unprotected Selfdestruct:** Verifica que nadie pueda destruir la bóveda.

---

## 📊 Reportes

Para guardar los resultados en un formato legible:
```bash
myth analyze contracts/SentinelVault.sol -o markdown > audit_report.md
```

## ⚠️ Nota de Rendimiento
La ejecución simbólica es intensiva en CPU. No te asustes si Mythril tarda varios minutos en analizar contratos complejos como `SentinelVaultERC4626.sol`. Es normal mientras explora todos los estados posibles.
