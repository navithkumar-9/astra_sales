const fs = require('fs');
const path = require('path');

const basePath = 'd:\\Wizmindz\\astra_sales\\Frontend\\frontend_admin\\src\\pages';
const sourceFile = path.join(basePath, 'SalesToQuote.jsx');
const content = fs.readFileSync(sourceFile, 'utf8');

const pages = {
    'OpenL1': ['Open - L1', 'Open L1'],
    'Won': ['Won', 'Won'],
    'Regretted': ['Regretted', 'Regretted'],
    'Lost': ['Lost', 'Lost'],
    'Hold': ['On Hold', 'Hold']
};

for (const [componentName, [statusVal, label]] of Object.entries(pages)) {
    let newContent = content;
    newContent = newContent.replace(/SalesToQuote/g, componentName);
    newContent = newContent.replace(/status:\s*'Sales to Quote'/g, `status: '${statusVal}'`);
    newContent = newContent.replace(/Sales to Quote stage/g, `${label} stage`);
    newContent = newContent.replace(/>Sales to Quote</g, `>${label}<`);
    
    fs.writeFileSync(path.join(basePath, `${componentName}.jsx`), newContent, 'utf8');
}
console.log('Generated 5 pages.');
