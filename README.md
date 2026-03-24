# Asisteme CLI

Plantilla global inicializadora de agentes de Antigravity para inyectar entornos `.agent` en repositorios y proyectos.

## Instalación y Uso

La forma más recomendada y rápida de utilizar este CLI es mediante `npx`, ejecutándolo en la raíz de cualquier repositorio o proyecto donde quieras instalar los agentes.

### Interfaz Interactiva (TUI)

Para lanzar el asistente interactivo, que te dejará elegir entre instalar por primera vez o actualizar el entorno existente:

```bash
npx @fernandoitur/asisteme-cli
```

*- También puedes instalarlo globalmente en tu máquina si lo prefieres (`npm install -g @fernandoitur/asisteme-cli`) y usar simplemente el comando `asisteme-cli`.*

### Iniciar o Actualizar Directamente

Si ya tienes una carpeta `.agent` inicializada en el proyecto actual y quieres sobreescribirla de manera forzada con tu plantilla base más reciente, usa el argumento update:

```bash
npx @fernandoitur/asisteme-cli update
```

> **Aviso de Seguridad:** Una vez que ejecutes una actualización de la plantilla base en un proyecto existente, es recomendable usar `git diff` y `git status` para comprobar si se ha sobreescrito alguna configuración particular que habías definido temporalmente en ese proyecto.

## Funcionalidades
- **Init:** Copia de forma rápida la carpeta `.agent`.
- **Update:** Actualiza tu proyecto local para tener la versión más novedosa de tus directrices y herramientas de agentes Antigravity.
- **Skills:** Explora y añade capacidades dinámicas a tu proyecto desde un catálogo unificado.
- **Context:** Recaba el stack tecnológico y alcance de tu proyecto y prepara el terreno automáticamente para la IA (Brainstorming).

---

## Créditos y Agradecimientos

Este proyecto es una adaptación y extensión personalizada para el ecosistema de **Asisteme**, basada originalmente en el excelente trabajo de:

- **Antigravity Kit** por [vudovn](https://github.com/vudovn/antigravity-kit)

Agradecemos a la comunidad por compartir herramientas que nos permiten construir flujos de IA más eficientes.

