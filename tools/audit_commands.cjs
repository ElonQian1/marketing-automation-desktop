const fs = require('fs');
const path = require('path');
// const glob = require('glob'); // Removed dependency

function getAllFiles(dirPath, arrayOfFiles, extensions) {
  files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles, extensions);
    } else {
      if (extensions.some(ext => file.endsWith(ext))) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

const rustDir = path.join(__dirname, '../src-tauri/src');
const frontendDir = path.join(__dirname, '../src');

// 1. Find all defined commands in Rust
const rustFiles = getAllFiles(rustDir, [], ['.rs']);
const definedCommands = new Map(); // name -> filePath

const commandRegex = /#\[tauri::command\]\s*(?:async\s+)?fn\s+([a-zA-Z0-9_]+)/g;

rustFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    while ((match = commandRegex.exec(content)) !== null) {
        definedCommands.set(match[1], file);
    }
});

console.log(`Found ${definedCommands.size} defined commands in Rust.`);

// 2. Find registered commands in main.rs (and potentially lib.rs)
// This is a heuristic. It looks for generate_handler![ ... ]
const mainRsPath = path.join(rustDir, 'main.rs');
let registeredCommands = new Set();

if (fs.existsSync(mainRsPath)) {
    const content = fs.readFileSync(mainRsPath, 'utf-8');
    // Match content inside generate_handler![ ... ]
    // This is tricky with regex if it spans multiple lines.
    // We'll try to capture the block.
    const handlerMatch = /generate_handler!\[([\s\S]*?)\]/.exec(content);
    if (handlerMatch) {
        const inner = handlerMatch[1];
        // Split by comma, remove whitespace and comments
        const cmds = inner.split(',')
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('//'));
        
        cmds.forEach(c => {
            // Handle module::command syntax if present, though usually it's just the function name if imported
            const name = c.split('::').pop(); 
            registeredCommands.add(name);
        });
    }
}

console.log(`Found ${registeredCommands.size} registered commands in main.rs.`);

// 3. Find frontend usages
const tsFiles = getAllFiles(frontendDir, [], ['.ts', '.tsx', '.js', '.jsx']);
const invokedCommands = new Map(); // commandName -> [files]

// Regex for invoke('cmd_name') or invoke("cmd_name")
// Also handles invoke<T>('cmd_name')
const invokeRegex = /invoke(?:<[^>]+>)?\s*\(\s*['"]([a-zA-Z0-9_:]+)['"]/g;

tsFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    while ((match = invokeRegex.exec(content)) !== null) {
        const cmdName = match[1];
        if (!invokedCommands.has(cmdName)) {
            invokedCommands.set(cmdName, []);
        }
        invokedCommands.get(cmdName).push(file);
    }
});

console.log(`Found ${invokedCommands.size} unique commands invoked in Frontend.`);

// 4. Analysis

// A. Defined but not registered (Zombies)
const zombies = [];
for (const [cmd, file] of definedCommands) {
    if (!registeredCommands.has(cmd)) {
        zombies.push({ cmd, file });
    }
}

// B. Invoked but not registered (Broken Frontend)
const broken = [];
for (const [cmd, files] of invokedCommands) {
    // Check if it's a plugin command (contains :)
    if (cmd.includes(':')) {
        // Skip plugin commands for now, or check if plugin is registered (harder)
        continue;
    }

    if (!registeredCommands.has(cmd)) {
        // It might be defined but not registered
        const isDefined = definedCommands.has(cmd);
        broken.push({ cmd, isDefined, files });
    }
}

// Output Report
console.log('\n--- REPORT ---\n');

console.log(`\n[CRITICAL] Frontend invoking Missing Commands (${broken.length}):`);
broken.forEach(item => {
    console.log(`  - ${item.cmd}`);
    console.log(`    Defined in Rust? ${item.isDefined ? 'YES (' + definedCommands.get(item.cmd) + ')' : 'NO'}`);
    console.log(`    Used in: ${item.files.length} files (e.g. ${path.relative(path.join(__dirname, '..'), item.files[0])})`);
});

console.log(`\n[INFO] Defined but Unregistered Commands (Zombies) - Top 20 of ${zombies.length}:`);
zombies.slice(0, 20).forEach(item => {
    console.log(`  - ${item.cmd} (${path.relative(path.join(__dirname, '..'), item.file)})`);
});

// Save full report
const report = {
    broken,
    zombies,
    stats: {
        defined: definedCommands.size,
        registered: registeredCommands.size,
        invoked: invokedCommands.size
    }
};

fs.writeFileSync(path.join(__dirname, 'command_audit_report.json'), JSON.stringify(report, null, 2));
console.log('\nFull report saved to tools/command_audit_report.json');
