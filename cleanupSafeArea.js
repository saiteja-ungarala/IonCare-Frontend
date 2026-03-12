const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function removeSafeAreaViewFromReactNativeImport(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file imports from 'react-native'
    const reactNativeImportRegex = /import\s+{([^}]*)}\s+from\s+['"]react-native['"];/g;
    
    let needsSave = false;
    content = content.replace(reactNativeImportRegex, (match, importsBlock) => {
        if (importsBlock.includes('SafeAreaView')) {
            needsSave = true;
            
            // Remove SafeAreaView from the block
            let newImportsBlock = importsBlock
                .split(',')
                .map(i => i.trim())
                .filter(i => i && i !== 'SafeAreaView')
                .join(',\n    ');
                
            // If there's nothing left in the block, we could remove the whole import, but usually there are other things like View, Text
            if (newImportsBlock.length === 0) {
                return ''; // remove entire line
            }
            return `import {\n    ${newImportsBlock}\n} from 'react-native';`;
        }
        return match;
    });

    if (needsSave) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Cleaned duplicate SafeAreaView in ${filePath}`);
    }
}

const dirToClean = path.join(__dirname, 'src/screens');
walkDir(dirToClean, removeSafeAreaViewFromReactNativeImport);
console.log("Cleanup complete!");
