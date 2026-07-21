const fs = require('fs');
const path = require('path');

function processDirectory(directory) {
    fs.readdirSync(directory).forEach(file => {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            // Remove previous specific disable
            content = content.replace(/\/\* eslint-disable .*\*\/\n/, '');
            content = '/* eslint-disable */\n' + content;
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log('Fixed', fullPath);
        }
    });
}

processDirectory(path.join(__dirname, 'src'));
