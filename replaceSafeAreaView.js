const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src/screens');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if the file imports SafeAreaView from 'react-native'
    if (content.match(/import\s+{([^}]*?)SafeAreaView([^}]*?)}\s+from\s+'react-native';/g) || content.match(/import\s+.*SafeAreaView.*from\s+'react-native'/)) {
        
        // Remove SafeAreaView from react-native import
        content = content.replace(/(import\s+{)(.*?)SafeAreaView(.*?)(}\s+from\s+'react-native';)/g, (match, p1, p2, p3, p4) => {
            const before = p2.trim().replace(/,\s*$/, '');
            const after = p3.trim().replace(/^,\s*/, '');
            const combined = [before, after].filter(Boolean).join(', ');
            
            if (!combined) {
                return ''; // Removes the whole import line if SafeAreaView was the only export
            }
            return `${p1} ${combined} ${p4}`;
        });

        // Add import for react-native-safe-area-context if it doesn't already exist
        if (!content.includes("from 'react-native-safe-area-context'")) {
            // Find the last import statement and add it after
            const lastImportIndex = content.lastIndexOf("import ");
            if (lastImportIndex !== -1) {
                const endOfLastImport = content.indexOf('\n', lastImportIndex);
                content = content.slice(0, endOfLastImport + 1) + "import { SafeAreaView } from 'react-native-safe-area-context';\n" + content.slice(endOfLastImport + 1);
            } else {
                content = "import { SafeAreaView } from 'react-native-safe-area-context';\n" + content;
            }
        } else if (!content.match(/import\s+{.*SafeAreaView.*}\s+from\s+'react-native-safe-area-context'/)) {
             // Append to existing safe area context import
              content = content.replace(/(import\s+{)(.*?)(}\s+from\s+'react-native-safe-area-context';)/g, "$1$2, SafeAreaView$3");
        }

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            replaceInFile(fullPath);
        }
    });
}

processDirectory(directoryPath);
console.log('Replacement complete.');
