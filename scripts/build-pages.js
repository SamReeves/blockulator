#!/usr/bin/env node
/**
 * Build Script for MPA Pages
 * Generates game and tool pages from templates
 */

const fs = require('fs');
const path = require('path');

// Game metadata
const GAMES = [
    {
        id: 'pissing-contest',
        title: 'Pissing Contest',
        emoji: '💦',
        description: 'Biggest donation takes the pot',
        export: 'PissingContest',
        module: 'pissing-contest'
    },
    {
        id: 'pay-it-forward',
        title: 'Pay It Forward',
        emoji: '⏩',
        description: 'Get previous player\'s donation',
        export: 'PayItForward',
        module: 'pay-it-forward'
    },
    {
        id: 'pay-it-backward',
        title: 'Pay It Backward',
        emoji: '⏪',
        description: 'Reward the previous donor',
        export: 'PayItBackward',
        module: 'pay-it-backward'
    },
    {
        id: 'message-board',
        title: 'Message Board',
        emoji: '💬',
        description: 'Permanent on-chain messages',
        export: 'MessageBoard',
        module: 'message-board'
    },
    {
        id: 'king-of-the-hill',
        title: 'King of the Hill',
        emoji: '👑',
        description: 'Dethrone king, stakes grow',
        export: 'KingOfTheHill',
        module: 'king-of-the-hill'
    },
    {
        id: 'last-call',
        title: 'Last Call',
        emoji: '⏰',
        description: 'Last donor wins after timer',
        export: 'LastCall',
        module: 'last-call'
    },
    {
        id: 'time-to-make-the-donuts',
        title: 'Make the Donuts',
        emoji: '🍩',
        description: 'First donor daily at midnight',
        export: 'TimeToMakeTheDonuts',
        module: 'time-to-make-the-donuts'
    },
    {
        id: 'dice-gods',
        title: 'Dice Gods',
        emoji: '🎲',
        description: 'Pick the least popular number',
        export: 'DiceGods',
        module: 'dice-gods'
    },
    {
        id: 'satan-moloch-baal',
        title: 'Satan, Moloch, Baal',
        emoji: '🔥',
        description: 'Vote for demons or burn to void',
        export: 'SatanMolochBaal',
        module: 'satan-moloch-baal'
    }
];

// Tool metadata
const TOOLS = [
    {
        id: 'pi-calculator',
        title: 'Pi Calculator',
        emoji: 'π',
        description: 'Calculate Pi on-chain',
        export: 'PiCalculator',
        module: 'pi-calculator'
    },
    {
        id: 'e-calculator',
        title: 'E Calculator',
        emoji: 'e',
        description: 'Calculate Euler\'s number',
        export: 'ECalculator',
        module: 'e-calculator'
    },
    {
        id: 'tau-calculator',
        title: 'Tau Calculator',
        emoji: 'τ',
        description: 'Calculate Tau (2π)',
        export: 'TauCalculator',
        module: 'tau-calculator'
    },
    {
        id: 'sin-calculator',
        title: 'Sin Calculator',
        emoji: '〰️',
        description: 'Calculate sine',
        export: 'SinCalculator',
        module: 'sin-calculator'
    },
    {
        id: 'cos-calculator',
        title: 'Cos Calculator',
        emoji: '〰️',
        description: 'Calculate cosine',
        export: 'CosCalculator',
        module: 'cos-calculator'
    },
    {
        id: 'tanh-calculator',
        title: 'Tanh Calculator',
        emoji: '📈',
        description: 'Calculate hyperbolic tangent',
        export: 'TanhCalculator',
        module: 'tanh-calculator'
    },
    {
        id: 'sqrt-calculator',
        title: 'Sqrt Calculator',
        emoji: '√',
        description: 'Calculate square root',
        export: 'SqrtCalculator',
        module: 'sqrt-calculator'
    },
    {
        id: 'ln-calculator',
        title: 'Ln Calculator',
        emoji: '📊',
        description: 'Calculate natural logarithm',
        export: 'LnCalculator',
        module: 'ln-calculator'
    },
    {
        id: 'log2-calculator',
        title: 'Log2 Calculator',
        emoji: '📊',
        description: 'Calculate base-2 logarithm',
        export: 'Log2Calculator',
        module: 'log2-calculator'
    },
    {
        id: 'log10-calculator',
        title: 'Log10 Calculator',
        emoji: '📊',
        description: 'Calculate base-10 logarithm',
        export: 'Log10Calculator',
        module: 'log10-calculator'
    },
    {
        id: 'pow2-calculator',
        title: 'Pow2 Calculator',
        emoji: '²',
        description: 'Calculate power of 2',
        export: 'Pow2Calculator',
        module: 'pow2-calculator'
    },
    {
        id: 'pow10-calculator',
        title: 'Pow10 Calculator',
        emoji: '¹⁰',
        description: 'Calculate power of 10',
        export: 'Pow10Calculator',
        module: 'pow10-calculator'
    },
    {
        id: 'erf-calculator',
        title: 'Erf Calculator',
        emoji: '∫',
        description: 'Calculate error function',
        export: 'ErfCalculator',
        module: 'erf-calculator'
    }
];

/**
 * Read template file
 */
function readTemplate(filename) {
    const templatePath = path.join(__dirname, '..', 'templates', filename);
    return fs.readFileSync(templatePath, 'utf8');
}

/**
 * Write file
 */
function writeFile(filepath, content) {
    const fullPath = path.join(__dirname, '..', filepath);
    const dir = path.dirname(fullPath);
    
    // Ensure directory exists
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Created: ${filepath}`);
}

/**
 * Generate game pages
 */
function generateGamePages() {
    console.log('\n🎮 Generating game pages...\n');
    const template = readTemplate('game-page.html');
    
    GAMES.forEach(game => {
        const content = template
            .replace(/{{GAME_TITLE}}/g, game.title)
            .replace(/{{GAME_DESCRIPTION}}/g, game.description)
            .replace(/{{GAME_EXPORT}}/g, game.export)
            .replace(/{{GAME_MODULE}}/g, game.module);
        
        writeFile(`games/${game.id}.html`, content);
    });
    
    console.log(`\n✅ Generated ${GAMES.length} game pages\n`);
}

/**
 * Generate tool pages
 */
function generateToolPages() {
    console.log('\n🧮 Generating tool pages...\n');
    const template = readTemplate('tool-page.html');
    
    TOOLS.forEach(tool => {
        const content = template
            .replace(/{{TOOL_TITLE}}/g, tool.title)
            .replace(/{{TOOL_DESCRIPTION}}/g, tool.description)
            .replace(/{{TOOL_EXPORT}}/g, tool.export)
            .replace(/{{TOOL_MODULE}}/g, tool.module);
        
        writeFile(`tools/${tool.id}.html`, content);
    });
    
    console.log(`\n✅ Generated ${TOOLS.length} tool pages\n`);
}

/**
 * Generate games index page
 */
function generateGamesIndex() {
    console.log('\n📄 Generating games/index.html...\n');
    
    const gameCards = GAMES.map(game => `
        <a href="${game.id}.html" class="game-card">
            <h3>${game.emoji} ${game.title}</h3>
            <p>${game.description}</p>
        </a>`).join('\n');
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Blockulator - Blockchain games on Sepolia testnet">
    <title>Games - Blockulator</title>
    <link rel="icon" type="image/png" href="/blockulator_favicon.png">
    <link rel="stylesheet" href="/styles.css">
</head>
<body class="games-index-page">
    <!-- Shared header loaded dynamically -->
    <div id="header-container"></div>
    
    <main class="page-content">
        <!-- Breadcrumb navigation -->
        <nav class="breadcrumb">
            <a href="/index.html" class="breadcrumb-link">Home</a> →
            <span class="breadcrumb-current">Games</span>
        </nav>
        
        <div class="page-header">
            <h2 class="page-title">🎮 Blockchain Games</h2>
            <p class="page-subtitle">Play games with real blockchain transactions on Sepolia testnet</p>
        </div>
        
        <!-- Game grid -->
        <div class="game-grid">
${gameCards}
        </div>
    </main>
    
    <!-- Toast container -->
    <div id="toast-container"></div>
    
    <!-- Initialize page -->
    <script type="module">
        import { initializePage } from '/shared/js/page-initializer.js';
        
        async function init() {
            try {
                await initializePage();
                console.log('✅ Games index page ready');
            } catch (error) {
                console.error('❌ Failed to initialize page:', error);
            }
        }
        
        init();
    </script>
</body>
</html>`;
    
    writeFile('games/index.html', html);
    console.log('\n✅ Generated games/index.html\n');
}

/**
 * Generate tools index page
 */
function generateToolsIndex() {
    console.log('\n📄 Generating tools/index.html...\n');
    
    const toolCards = TOOLS.map(tool => `
        <a href="${tool.id}.html" class="tool-card">
            <h3>${tool.emoji} ${tool.title}</h3>
            <p>${tool.description}</p>
        </a>`).join('\n');
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Blockulator - Blockchain calculators on Sepolia testnet">
    <title>Tools - Blockulator</title>
    <link rel="icon" type="image/png" href="/blockulator_favicon.png">
    <link rel="stylesheet" href="/styles.css">
</head>
<body class="tools-index-page">
    <!-- Shared header loaded dynamically -->
    <div id="header-container"></div>
    
    <main class="page-content">
        <!-- Breadcrumb navigation -->
        <nav class="breadcrumb">
            <a href="/index.html" class="breadcrumb-link">Home</a> →
            <span class="breadcrumb-current">Tools</span>
        </nav>
        
        <div class="page-header">
            <h2 class="page-title">🧮 Blockchain Calculators</h2>
            <p class="page-subtitle">Mathematical functions executed on-chain</p>
        </div>
        
        <!-- Tool grid -->
        <div class="tool-grid">
${toolCards}
        </div>
    </main>
    
    <!-- Toast container -->
    <div id="toast-container"></div>
    
    <!-- Initialize page -->
    <script type="module">
        import { initializePage } from '/shared/js/page-initializer.js';
        
        async function init() {
            try {
                await initializePage();
                console.log('✅ Tools index page ready');
            } catch (error) {
                console.error('❌ Failed to initialize page:', error);
            }
        }
        
        init();
    </script>
</body>
</html>`;
    
    writeFile('tools/index.html', html);
    console.log('\n✅ Generated tools/index.html\n');
}

// Main execution
console.log('🏗️  Building MPA pages...\n');
console.log('=' .repeat(50));

generateGamePages();
generateToolPages();
generateGamesIndex();
generateToolsIndex();

console.log('=' .repeat(50));
console.log('\n✅ Build complete!\n');
console.log(`Generated:
  - ${GAMES.length} game pages
  - ${TOOLS.length} tool pages
  - 2 index pages (games, tools)
`);

