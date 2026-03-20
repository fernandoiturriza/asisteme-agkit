#!/usr/bin/env node
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import path from 'path';
import { intro, outro, spinner, note, isCancel, cancel, select, multiselect } from '@clack/prompts';
import pc from 'picocolors';

// Obtenemos la ruta donde está instalado globalmente este paquete
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.join(__dirname, '..');

async function main() {
  console.clear();
  intro(pc.bgBlue(pc.white(' Asisteme Agent Kit (agkit) ')));

  const command = process.argv[2];

  // Si no hay comando o es init, lanzamos el menú interactivo
  if (!command || command === 'init') {
    const action = await select({
      message: '¿Qué deseas hacer en este proyecto?',
      options: [
        { value: 'init', label: 'Inicializar entorno .agent', hint: 'Recomendado para proyectos nuevos' },
        { value: 'update', label: 'Actualizar entorno .agent', hint: 'Sobrescribe los archivos locales con la última versión de la plantilla' },
        { value: 'skills', label: 'Agregar skills', hint: 'Agrega nuevos skills desde la plantilla general al proyecto' },
        { value: 'cancel', label: 'Salir' }
      ]
    });

    if (isCancel(action) || action === 'cancel') {
      cancel('Operación cancelada.');
      process.exit(0);
    }

    await executeAction(action);
  } else if (command === 'update') {
    // Si el usuario ejecutó "create-agkit update" saltando el menú
    await executeAction('update');
  } else if (command === 'skills') {
    // Si el usuario ejecutó "create-agkit skills" saltando el menú
    await executeAction('skills');
  } else {
    note(
      `Uso:\n  npx @fernandoitur/asisteme-agkit        - Modo interactivo (TUI)\n  npx @fernandoitur/asisteme-agkit update - Ejecuta la actualización directamente\n  npx @fernandoitur/asisteme-agkit skills - Añadir skills desde el repositorio central`,
      'Comandos disponibles'
    );
    outro(pc.yellow('Comando no reconocido.'));
  }
}

async function executeAction(action) {
  const sourceAgentPath = path.join(packageRoot, '.agent');
  const targetAgentPath = path.join(process.cwd(), '.agent');
  const s = spinner();

  if (action === 'init') {
    if (fs.existsSync(targetAgentPath)) {
      cancel(pc.red('La carpeta .agent ya existe en este proyecto.\nSi deseas actualizarla con la última plantilla, selecciona o usa la opción "Update".'));
      process.exit(1);
    }

    s.start('Clonando entorno de agentes de Antigravity...');
    try {
      fs.copySync(sourceAgentPath, targetAgentPath);
      s.stop('¡Plantilla inyectada!');
      outro(pc.green('🚀 Todo listo. ¡Tus agentes ya están disponibles en este repositorio!'));
    } catch (err) {
      s.stop('Error copiando archivos');
      cancel(pc.red(err.message));
      process.exit(1);
    }
  } else if (action === 'update') {
    if (!fs.existsSync(targetAgentPath)) {
      cancel(pc.red('La carpeta .agent no existe en este proyecto.\nPor favor, inicializa el entorno primero.'));
      process.exit(1);
    }

    s.start('Actualizando entorno de agentes...');
    try {
      fs.copySync(sourceAgentPath, targetAgentPath, { overwrite: true });
      s.stop('¡Entorno actualizado con éxito!');
      note('Recuerda revisar Git (git diff/status) por si modifiques opciones locales que se hayan sobrescrito con la última versión de la plantilla central.', 'Aviso de Seguridad');
      outro(pc.green('🚀 Actualización completada satisfactoriamente.'));
    } catch (err) {
      s.stop('Error sobrescribiendo archivos');
      cancel(pc.red(err.message));
      process.exit(1);
    }
  } else if (action === 'skills') {
    const masSkillsPath = path.join(packageRoot, 'masSkills');
    const targetSkillsPath = path.join(process.cwd(), '.agent', 'skills');

    if (!fs.existsSync(masSkillsPath)) {
      cancel(pc.red('No se encontró el directorio masSkills en la plantilla.'));
      process.exit(1);
    }

    if (!fs.existsSync(targetAgentPath)) {
      cancel(pc.red('La carpeta .agent no existe en este proyecto.\nPor favor, inicializa el entorno primero.'));
      process.exit(1);
    }

    const availableSkills = fs.readdirSync(masSkillsPath)
      .filter(f => fs.statSync(path.join(masSkillsPath, f)).isDirectory());

    if (availableSkills.length === 0) {
      outro(pc.yellow('No hay skills adicionales disponibles en masSkills.'));
      process.exit(0);
    }

    const selectedSkills = await multiselect({
      message: 'Selecciona los skills que deseas agregar (Usa espacio para seleccionar, Enter para confirmar):',
      options: availableSkills.map(skill => ({ value: skill, label: skill })),
      required: false
    });

    if (isCancel(selectedSkills)) {
      cancel('Operación cancelada.');
      process.exit(0);
    }

    if (selectedSkills.length === 0) {
      outro(pc.yellow('No se seleccionó ningún skill.'));
      process.exit(0);
    }

    s.start('Copiando skills seleccionados...');
    try {
      fs.ensureDirSync(targetSkillsPath);
      for (const skill of selectedSkills) {
        fs.copySync(path.join(masSkillsPath, skill), path.join(targetSkillsPath, skill), { overwrite: true });
      }
      s.stop('¡Skills agregados con éxito!');
      outro(pc.green(`🚀 Se agregaron ${selectedSkills.length} skills al proyecto.`));
    } catch (err) {
      s.stop('Error copiando skills');
      cancel(pc.red(err.message));
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(pc.red('Error crítico de ejecución:'), err);
  process.exit(1);
});
