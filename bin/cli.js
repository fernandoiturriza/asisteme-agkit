#!/usr/bin/env node
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import path from 'path';
import { intro, outro, spinner, note, isCancel, cancel, select, multiselect, text } from '@clack/prompts';
import pc from 'picocolors';

// Obtenemos la ruta donde está instalado globalmente este paquete
import { downloadTemplate } from 'giget';

import gradient from 'gradient-string';

// Configuración del repositorio central (Usuario/Repositorio)
const REPO_BASE = 'fernandoiturriza/asisteme-cli';

// Diseño de Banner ASCII
const BANNER_ART = `
 █████╗ ███████╗██╗███████╗████████╗███████╗███╗   ███╗███████╗
██╔══██╗██╔════╝██║██╔════╝╚══██╔══╝██╔════╝████╗ ████║██╔════╝
███████║███████╗██║███████╗   ██║   █████╗  ██╔████╔██║█████╗  
██╔══██║╚════██║██║╚════██║   ██║   ██╔══╝  ██║╚██╔╝██║██╔══╝  
██║  ██║███████║██║███████║   ██║   ███████╗██║ ╚═╝ ██║███████╗
╚═╝  ╚═╝╚══════╝╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝     ╚═╝╚══════╝

              ⚡ ASISTEME CLI ⚡
`;

const agkitGradient = gradient(['#4FACFE', '#00F2FE', '#007BFD']);
const divider = pc.dim(' —————————————————————————————————————————————————————————————————');

async function main() {
  console.clear();
  console.log(agkitGradient.multiline(BANNER_ART));
  console.log(divider);

  intro(pc.cyan('— Bienvenido al centro de control de agentes'));

  const command = process.argv[2];

  // Si se pasa un comando directo por argumento, lo ejecutamos una vez y salimos
  if (command === 'update' || command === 'skills') {
    await executeAction(command);
    process.exit(0);
  }

  // Bucle infinito para mantener la TUI abierta
  while (true) {
    const hasAgent = fs.existsSync(path.join(process.cwd(), '.agent'));

    // Generamos las opciones dinámicamente
    const options = [];

    if (!hasAgent) {
      options.push({ value: 'init', label: '🚀  Inicializar Multi-Agente', hint: 'Crea y configura .agent' });
    } else {
      options.push({ value: 'update', label: '🔄  Actualizar Multi-Agente', hint: 'Sincronizar .agent con la última versión.' });
      options.push({ value: 'skills', label: '🧩  Gestionar Skills', hint: 'Agregar habilidades adicionales.' });
      options.push({ value: 'context', label: '📝  Definir Contexto del Proyecto', hint: 'Configurar tecnologias del proyecto.' });
    }

    options.push({ value: 'cancel', label: '❌  Salir' });

    const action = await select({
      message: '¿Qué operación deseas realizar?',
      options: options
    });

    if (isCancel(action) || action === 'cancel') {
      outro(pc.yellow('👋 ¡Hasta luego!'));
      process.exit(0);
    }

    await executeAction(action);
    console.log(pc.dim('\n' + divider + '\n')); // Separador tras completar una acción
  }
}

async function executeAction(action) {
  const targetAgentPath = path.join(process.cwd(), '.agent');
  const s = spinner();

  if (action === 'init') {
    if (fs.existsSync(targetAgentPath)) {
      note(pc.yellow('La carpeta .agent ya existe en este proyecto.\nSi deseas bajar la última versión, usa la opción "Update Multi-Agente".'), 'Aviso');
      return; // Volvemos al bucle principal
    }

    s.start('Descargando entorno de agentes desde GitHub...');
    try {
      await downloadTemplate(`github:${REPO_BASE}/.agent`, {
        dir: targetAgentPath,
        force: true,
        preferOffline: false,
      });
      s.stop('¡Plantilla descargada con éxito!');

      // Llamada al recolector de contexto interactivo
      await collectProjectContext(targetAgentPath);

      outro(pc.green('🚀 Todo listo. ¡Tus agentes ya están disponibles en este repositorio!'));
    } catch (err) {
      s.stop('Error descargando archivos');
      cancel(pc.red(`No se pudo conectar con el repositorio o la carpeta no existe: ${err.message}`));
      process.exit(1);
    }
  } else if (action === 'update') {
    if (!fs.existsSync(targetAgentPath)) {
      cancel(pc.red('La carpeta .agent no existe.\nPor favor, inicializa el entorno primero.'));
      process.exit(1);
    }

    s.start('Actualizando entorno de agentes desde la nube...');
    try {
      await downloadTemplate(`github:${REPO_BASE}/.agent`, {
        dir: targetAgentPath,
        force: true,
        preferOffline: false,
      });
      s.stop('¡Entorno actualizado!');
      note('Se han sobrescrito los archivos base del entorno .agent con la última versión de GitHub.', 'Aviso');
      outro(pc.green('🚀 Actualización completada satisfactoriamente.'));
    } catch (err) {
      s.stop('Error en la actualización');
      cancel(pc.red(err.message));
      process.exit(1);
    }
  } else if (action === 'skills') {
    // Para los skills, primero descargamos la carpeta masSkills a un directorio temporal
    const tempSkillsPath = path.join(process.cwd(), '.agent', '.temp_skills');
    const finalSkillsPath = path.join(process.cwd(), '.agent', 'skills');

    if (!fs.existsSync(targetAgentPath)) {
      cancel(pc.red('La carpeta .agent no existe.\nPor favor, inicializa primero.'));
      process.exit(1);
    }

    s.start('Buscando skills disponibles en el repositorio central...');
    try {
      // Limpiamos temporal previo si existe
      if (fs.existsSync(tempSkillsPath)) fs.removeSync(tempSkillsPath);

      await downloadTemplate(`github:${REPO_BASE}/masSkills`, {
        dir: tempSkillsPath,
        force: true,
        preferOffline: false,
      });
      s.stop('Lista de skills sincronizada.');

      const availableSkills = fs.readdirSync(tempSkillsPath)
        .filter(f => fs.statSync(path.join(tempSkillsPath, f)).isDirectory());

      if (availableSkills.length === 0) {
        fs.removeSync(tempSkillsPath);
        note('No hay skills adicionales disponibles en el repositorio.', 'Aviso');
        return;
      }

      const selectedSkills = await multiselect({
        message: 'Selecciona los skills que deseas agregar:',
        options: availableSkills.map(skill => ({ value: skill, label: skill })),
        required: false
      });

      if (isCancel(selectedSkills) || selectedSkills.length === 0) {
        fs.removeSync(tempSkillsPath);
        note('Operación cancelada. No se instalaron skills.', 'Aviso');
        return;
      }

      s.start('Inyectando skills seleccionados...');
      fs.ensureDirSync(finalSkillsPath);
      for (const skill of selectedSkills) {
        fs.copySync(path.join(tempSkillsPath, skill), path.join(finalSkillsPath, skill), { overwrite: true });
      }

      // Limpiamos la carpeta temporal
      fs.removeSync(tempSkillsPath);

      s.stop('¡Skills inyectados!');
      outro(pc.green(`🚀 Se agregaron ${selectedSkills.length} skills al proyecto.`));
    } catch (err) {
      if (fs.existsSync(tempSkillsPath)) fs.removeSync(tempSkillsPath);
      s.stop('Error sincronizando skills');
      cancel(pc.red(err.message));
      process.exit(1);
    }
  } else if (action === 'context') {
    if (!fs.existsSync(targetAgentPath)) {
      cancel(pc.red('La carpeta .agent no existe.\\nPor favor, inicializa el entorno primero.'));
      process.exit(1);
    }
    await collectProjectContext(targetAgentPath);
  }
}

async function collectProjectContext(targetPath) {
  note('Vamos a configurar el contexto inicial de tu proyecto para los agentes de IA.', 'Contexto del Proyecto');

  const frontend = await select({
    message: '🖥️  ¿Qué Frontend / Framework principal usarás?',
    options: [
      { value: 'Next.js (React)', label: 'Next.js (React)' },
      { value: 'React SPA (Vite)', label: 'React SPA (Vite)' },
      { value: 'Vue / Nuxt', label: 'Vue / Nuxt' },
      { value: 'Angular', label: 'Angular' },
      { value: 'Ninguno (Solo Backend/CLI)', label: 'Ninguno (Solo Backend/CLI)' }
    ]
  });
  if (isCancel(frontend)) return;

  const backend = await select({
    message: '⚙️  ¿Qué Backend / API usarás?',
    options: [
      { value: 'Hono', label: 'Hono (Edge/Node)' },
      { value: 'Express', label: 'Express / Node.js' },
      { value: 'NestJS', label: 'NestJS' },
      { value: 'Next.js API Routes', label: 'Next.js API Routes (Serverless)' },
      { value: 'Ninguno (Solo Frontend/BaaS)', label: 'Ninguno (Solo Frontend/BaaS)' }
    ]
  });
  if (isCancel(backend)) return;

  const database = await select({
    message: '🗄️  ¿Qué Base de Datos / BaaS usarás?',
    options: [
      { value: 'PostgreSQL + Drizzle', label: 'PostgreSQL + Drizzle ORM' },
      { value: 'PostgreSQL + Prisma', label: 'PostgreSQL + Prisma' },
      { value: 'InsForge', label: 'InsForge' },
      { value: 'Supabase / Firebase', label: 'Supabase / Firebase' },
      { value: 'SQLite local', label: 'SQLite local' },
      { value: 'Ninguna', label: 'Ninguna' }
    ]
  });
  if (isCancel(database)) return;

  const scope = await text({
    message: '🎯 Breve descripción o misión del proyecto:',
    placeholder: 'Ej: Un clon de Trello con tiempo real...',
    validate(value) {
      if (value.length === 0) return 'Por favor, ingresa una breve descripción.';
    }
  });
  if (isCancel(scope)) return;

  const contextContent = `# Contexto Inicial del Proyecto

- **Frontend:** ${frontend}
- **Backend:** ${backend}
- **Base de Datos:** ${database}

## Misión / Alcance
${scope}

---
**Instrucciones para la IA:**
Por favor, lee este archivo y ejecuta inmediatamente el flujo de trabajo @[/brainstorm] para proponerme la mejor arquitectura y próximos pasos basados en estas tecnologías elegidas. No empieces a programar hasta que yo apruebe el resultado del brainstorm.
`;

  fs.writeFileSync(path.join(targetPath, 'PROJECT_CONTEXT.md'), contextContent, 'utf-8');
  note('Archivo .agent/PROJECT_CONTEXT.md generado con éxito.\\n\\n🤖 Dile a tu agente de IA: "Lee el PROJECT_CONTEXT.md"', 'Contexto Guardado');
}

main().catch((err) => {
  console.error(pc.red('Error crítico de ejecución:'), err);
  process.exit(1);
});
