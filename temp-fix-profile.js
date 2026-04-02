const fs = require('fs');
const path = require('path');
const files = [
  'frontend/index.html',
  'frontend/login.html',
  'frontend/cadastro.html',
  'frontend/event-form.html',
  'frontend/contato.html',
  'frontend/editar-evento.html',
  'frontend/meus-eventos.html',
  'frontend/sobre.html'
];
files.forEach(file => {
  const p = path.resolve(file);
  let content = fs.readFileSync(p,'utf8');
  const before = /<a href="perfil.html" style="text-decoration: none;">\s*<div id="icone-perfil"[^>]*>[\s\S]*?<\/div>\s*<\/a>/g;
  if (before.test(content)) {
    content = content.replace(before, match => {
      const imgMatch = match.match(/<img[^>]*>/);
      const imgHtml = imgMatch ? imgMatch[0] : '<img id="icone-perfil-img" src="caminho-da-sua-foto.jpg" alt="Foto do Perfil">';
      return `<div id="icone-perfil" title="Meu Perfil" onclick="irParaPerfil()" style="cursor: pointer; text-decoration: none;">\n  ${imgHtml}\n</div>`;
    });
    fs.writeFileSync(p, content, 'utf8');
    console.log('Atualizado', file);
  }
});
