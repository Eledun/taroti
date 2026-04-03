const fs = require('fs');
const path = require('path');

function fixLogsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Patrón 1: fastify.log.error('message:', error) -> fastify.log.error({ error }, 'message')
  const regex1 = /fastify\.log\.error\('([^']+):', error\)/g;
  if (regex1.test(content)) {
    content = content.replace(regex1, "fastify.log.error({ error }, '$1')");
    modified = true;
  }

  // Patrón 2: fastify.log.info('message:', data) -> fastify.log.info({ data }, 'message')
  const regex2 = /fastify\.log\.info\('([^']+):', ([a-zA-Z]+)\)/g;
  if (regex2.test(content)) {
    content = content.replace(regex2, (match, msg, varName) => {
      return `fastify.log.info({ ${varName} }, '${msg}')`;
    });
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.ts')) {
      fixLogsInFile(filePath);
    }
  });
}

walkDir('./src');
console.log('Done!');
