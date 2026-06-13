const fs = require('fs');
const path = require('path');

const filesToFix = [
  "backend/models/remainderModel.js",
  "backend/config/multer.js",
  "backend/config/cloudinaryUpload.js",
  "backend/config/cloudinary.js",
  "backend/API/whatsappAPI.js",
  "backend/API/voiceAPI.js",
  "backend/API/userAPI.js",
  "backend/API/transactionAPI.js",
  "backend/API/pdfAPI.js",
  "backend/API/paymentAPI.js",
  "backend/API/notificationsAPI.js",
  "backend/API/customerAPI.js",
  "backend/API/analyticsAPI.js"
];

filesToFix.forEach(relPath => {
  const filePath = path.join(__dirname, relPath);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // import { X } from "Y" -> const { X } = require("Y")
  content = content.replace(/^import\s+\{\s*([^}]+)\s*\}\s+from\s+["']([^"']+)["'];?/gm, 'const { $1 } = require("$2");');
  
  // import X from "Y" -> const X = require("Y")
  content = content.replace(/^import\s+([^{}\s,]+)\s+from\s+["']([^"']+)["'];?/gm, 'const $1 = require("$2");');

  // export const X = ... -> const X = ...
  let exportedNames = [];
  content = content.replace(/^export\s+const\s+(\w+)\s*=/gm, (match, p1) => {
    if (!exportedNames.includes(p1)) exportedNames.push(p1);
    return `const ${p1} =`;
  });
  
  if (exportedNames.length > 0) {
     if (exportedNames.length === 1) {
         content += `\nmodule.exports = ${exportedNames[0]};\n`;
     } else {
         // wait, actually if it exports multiple, `module.exports = { ... }` is fine. 
         // But what if it's already an object? We just export the object.
         // Let's use `module.exports = ...` for the first one if there's only one, otherwise object.
         content += `\nmodule.exports = { ${exportedNames.join(', ')} };\n`;
     }
  }

  // Also catch default exports: export default X
  content = content.replace(/^export\s+default\s+(.*);?/gm, 'module.exports = $1;');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Fixed: " + relPath);
  }
});
