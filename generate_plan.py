plan_content = """# 🏛️ PLAN ARQUITECTURAL: Brandview UI Fixes (v2.0)

> **Marco de Gobernanza Activo:**  
> - [`Supreme Directive v8.4`](file:///var/www/.agents/rules/00-SUPREME-DIRECTIVE.md) (Fases F0–F5, Anti-Acción Inmediata)  
> - [`Planner v9.3`](file:///var/www/.agents/skills/planner/SKILL.md) (Protocolo Dual-Track & Mandato F4 Feedback Loop de Inmutabilidad Absoluta)  
> - [`Research`](file:///var/www/.agents/skills/research/SKILL.md) (Centinela de Inflow Epistémico Anti-AMN & Recibo `<epistemic_attestation>`)  
>  
> **Plan Track:** `Track B: Aplicaciones (Brandview)`  

## 1. 🔬 Diagnóstico & Grounding
<epistemic_attestation>
- Evaluado: `Step1Fonts.tsx`, `FloatingPanel.tsx`, `Header.tsx`.
- Problema 1: Ecosistemas hardcodeados en el dropdown (Rising, Jakarta, Calestra).
- Problema 2: Sliders del DOM (`<input type="range">`) se bloquean en modo controlado en SolidJS debido a contención de render y pointer events.
- Problema 3: Overflow horizontal en el `<select>` de clientes de Header.tsx.
- Problema 4: Falta herencia top-down en el visualizador al cambiar de modo (Bloque -> Palabra -> Letra).
</epistemic_attestation>

## 2. 🔀 Topología de Estados CoHaLo
- **Estado Actual**: Sliders controlados sincrónicamente (lag), Ecosistemas mockeados, Select expansivo.
- **Estado Futuro**: Sliders asíncronos desacoplados, Ecosistemas renderizados estrictamente desde el `brandData`, Select truncado, clonación de estilos por herencia.

## 3. 🛡️ Invariantes y Reglas No Negociables
- **Invariante 1**: No interceptar el click del input nativo con `stopPropagation`.
- **Invariante 2**: El slider local debe mantener su propio estado (`createSignal`) y delegar el evento final.
- **Invariante 3**: Todo cambio debe propagarse a SSoT localstorage.

## 4. 🗺️ Plan de Ejecución Modular (Fase 4)
1. **Paso 1 (Header)**: Modificar `Header.tsx` añadiendo `max-w-[200px] truncate text-ellipsis`.
2. **Paso 2 (Ecosistemas)**: Modificar `Step1Fonts.tsx` para retornar `[]` en `ecosystems()` si el manifest no existe. Inyección onClick.
3. **Paso 3 (Sliders)**: Modificar `FloatingPanel.tsx` inyectando un componente local `FluidSlider`.
4. **Paso 4 (Herencia Visualizador)**: Modificar `Step1Fonts.tsx` mode swap con clonación de properties.

## 5. 🚦 Matriz de Control y Criterios de Aceptación (Correspondencia Estricta)

| Nodo / Componente | Ruta SSoT | Backup en `bak/` | Versión Semver | Sensor de Atestación Física | Criterio de Aceptación |
|---|---|---|---|---|---|
| $N_1$: Frontend Build | `src/components/` | N/A | **v2.0** | `bun run build` | Compilación exitosa exit code 0 |
| $N_2$: SSoT Parity | `artifacts/` | N/A | **v2.0** | `ssot-parity-check` | Zero drift exit code 0 |
| $N_3$: Git Push | `.git/` | N/A | **v2.0** | `git push` | Push exitoso exit code 0 |

## 6. 🌐 Radar 360° de Daño Colateral y Riesgos Ocultos
- Análisis Sistémico (Aguas Arriba/Abajo): La alteración del clonado top-down afecta cómo se comportan otros módulos como Kinetic UI y Chroma. Los pipelines de despliegue en Zerops consumirán el fix de GitHub.

## 7. 🧩 Epistemic Surplus & Detección de Fracturas Periféricas
- Posible refactorización necesaria a futuro en SolidJS signals globales para evitar polling.

## 8. 🚫 Veto Técnico y Alternativas Arquitectónicas
- Alternativa: Componentes complejos y libraries UI externas.
- Veto: Mantenemos el Core ligero (Zero deps) con proxy inputs.

## Auto-Purge Protocol (Obligatorio)
- `mem_save`: SI, con key `brandview/fixes_v2`.
"""
with open("/var/www/artifacts/brandview_fixes_v2.md", "w") as f:
    f.write(plan_content)
