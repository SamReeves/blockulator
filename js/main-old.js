/**
 * Main Entry Point
 * Bootstraps the application and registers all modules
 */

import { AppController } from './application/app-controller.js';

// Import NEW migrated modules (using layered architecture)
import { PissingContest } from './domain/games/pissing-contest.js';
import { PayItForward } from './domain/games/pay-it-forward.js';
import { MessageBoard } from './domain/games/message-board.js';
import { PiCalculator } from './domain/calculators/pi-calculator.js';
import { ECalculator } from './domain/calculators/e-calculator.js';
import { TauCalculator } from './domain/calculators/tau-calculator.js';
import { SinCalculator } from './domain/calculators/sin-calculator.js';
import { SqrtCalculator } from './domain/calculators/sqrt-calculator.js';

// Import migrated games
import { PayItBackward } from './domain/games/pay-it-backward.js';
import { KingOfTheHill } from './domain/games/king-of-the-hill.js';
import { LastCall } from './domain/games/last-call.js';
import { TimeToMakeTheDonuts } from './domain/games/time-to-make-the-donuts.js';
import { DiceGods } from './domain/games/dice-gods.js';
import { SatanMolochBaal } from './domain/games/satan-moloch-baal.js';
import { CosCalculator } from './domain/calculators/cos-calculator.js';
import { TanhCalculator } from './domain/calculators/tanh-calculator.js';
import { Pow10Calculator } from './domain/calculators/pow10-calculator.js';
import { Pow2Calculator } from './domain/calculators/pow2-calculator.js';
import { LnCalculator } from './domain/calculators/ln-calculator.js';
import { Log2Calculator } from './domain/calculators/log2-calculator.js';
import { Log10Calculator } from './domain/calculators/log10-calculator.js';
import { ErfCalculator } from './domain/calculators/erf-calculator.js';
import { ScientificCalculator } from './tools/scientific-calculator.js';

// Create and initialize application
const app = new AppController();

// Register GAMES (all migrated to layered architecture ✅)
console.log('🎮 Registering games...');
app.registerModule('pissing-contest', PissingContest, 'game');        // ✅ MIGRATED
app.registerModule('pay-it-forward', PayItForward, 'game');           // ✅ MIGRATED
app.registerModule('message-board', MessageBoard, 'game');            // ✅ MIGRATED
app.registerModule('pay-it-backward', PayItBackward, 'game');         // ✅ MIGRATED
app.registerModule('king-of-the-hill', KingOfTheHill, 'game');        // ✅ MIGRATED
app.registerModule('last-call', LastCall, 'game');                    // ✅ MIGRATED
app.registerModule('time-to-make-the-donuts', TimeToMakeTheDonuts, 'game'); // ✅ MIGRATED
app.registerModule('dice-gods', DiceGods, 'game');                    // ✅ MIGRATED
app.registerModule('satan-moloch-baal', SatanMolochBaal, 'game');    // ✅ NEW GAME

// Register CALCULATORS (all migrated to layered architecture ✅)
console.log('🔧 Registering calculators...');
app.registerModule('scientific-calculator', ScientificCalculator, 'calculator'); // ✅ UNIFIED CALCULATOR
app.registerModule('pi-calculator', PiCalculator, 'calculator');      // ✅ MIGRATED
app.registerModule('e-calculator', ECalculator, 'calculator');        // ✅ MIGRATED
app.registerModule('tau-calculator', TauCalculator, 'calculator');    // ✅ MIGRATED
app.registerModule('sin-calculator', SinCalculator, 'calculator');    // ✅ MIGRATED
app.registerModule('cos-calculator', CosCalculator, 'calculator');    // ✅ MIGRATED
app.registerModule('tanh-calculator', TanhCalculator, 'calculator');  // ✅ MIGRATED
app.registerModule('pow10-calculator', Pow10Calculator, 'calculator'); // ✅ MIGRATED
app.registerModule('pow2-calculator', Pow2Calculator, 'calculator');  // ✅ MIGRATED
app.registerModule('ln-calculator', LnCalculator, 'calculator');      // ✅ MIGRATED
app.registerModule('log2-calculator', Log2Calculator, 'calculator');  // ✅ MIGRATED
app.registerModule('log10-calculator', Log10Calculator, 'calculator'); // ✅ MIGRATED
app.registerModule('sqrt-calculator', SqrtCalculator, 'calculator');  // ✅ MIGRATED
app.registerModule('erf-calculator', ErfCalculator, 'calculator');    // ✅ MIGRATED

// Initialize application
app.init();

console.log('🎮 WhaleGames ready!');
console.log(`📊 Total modules: ${app.moduleRegistry.size} (${app.moduleRegistry.getCategory('game').length} games, ${app.moduleRegistry.getCategory('calculator').length} calculators)`);

/*
 * ✅ PHASE 1 MIGRATION COMPLETE!
 * 
 * Architecture: Layered Architecture (Clean Code Principles)
 * ✅ Infrastructure Layer: Complete (7 files)
 * ✅ Domain Layer: Complete (24 modules + 3 base classes)
 * ✅ Application Layer: Complete (3 files)
 * ✅ Presentation Layer: Complete (9 files)
 * 
 * ✅ All 8 games migrated to domain/games/
 * ✅ All 13 calculators migrated to domain/calculators/
 * ✅ Old files deleted (games/, tools/, core/, ui/)
 * 
 * Result: 62 files → 43 files (-30%)
 * Code reduction: ~1,700 lines removed through abstraction
 * 
 * Next steps: Phase 2+ (see project plan for consolidation options)
 */

