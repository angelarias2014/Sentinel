# 🐍 Guía de Auditoría con Slither

Slither es un framework de análisis estático para Solidity escrito en Python. Detecta vulnerabilidades comunes, optimizaciones de gas y ayuda a entender la arquitectura del código.

## 🛠️ Instalación

Slither requiere **Python 3.8+** y **solc** (el compilador de Solidity).

### Opción 1: Usando pip (Recomendado)
```bash
# Instalar slither
pip3 install slither-analyzer

# Asegúrate de tener solc-select para gestionar versiones de Solidity
pip3 install solc-select
solc-select install 0.8.20 # O la versión que uses
solc-select use 0.8.20
```

### Opción 2: Usando Docker
```bash
docker pull trailofbits/eth-security-toolbox
docker run -it -v $(pwd):/share trailofbits/eth-security-toolbox
```

---

## 🚀 Uso Básico

Ejecuta Slither en la raíz de tu proyecto (donde está `hardhat.config.cjs` o `foundry.toml`):

```bash
slither .
```

### Comandos Útiles

1.  **Excluir dependencias (ej. OpenZeppelin):**
    ```bash
    slither . --filter-paths "node_modules"
    ```

2.  **Generar un reporte en JSON:**
    ```bash
    slither . --json report.json
    ```

3.  **Impresoras (Visualización):**
    Slither puede generar diagramas para entender el flujo:
    ```bash
    # Ver jerarquía de contratos
    slither . --print inheritance-graph
    
    # Ver resumen de funciones y permisos
    slither . --print function-summary
    ```

---

## 🔍 Análisis de Sentinel Vault

Para auditar específicamente nuestro sistema de bóvedas:

1.  **Chequeo de Reentrancy:**
    Slither detectará automáticamente si faltan modificadores `nonReentrant` en funciones que transfieren fondos antes de actualizar el estado.
2.  **Verificación de permisos:**
    Usa `--print authorization` para asegurar que solo el `owner` o agentes autorizados pueden ejecutar funciones críticas en `SentinelTreasury`.

## 📌 Mejores Prácticas
- Integra Slither en tu CI/CD para bloquear despliegues con vulnerabilidades de severidad "High".
- Revisa siempre las alertas de **Gas Optimization** para ahorrar costos en Mainnet.
