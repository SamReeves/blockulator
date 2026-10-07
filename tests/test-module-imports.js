/**
 * Test Module Imports
 * Validates that all game modules can be imported without errors
 * Specifically checks that TransactionHandler is properly available
 */

import { KingOfTheHill } from '../static/js/legacy/domain/games/king-of-the-hill.js';
import { LastCall } from '../static/js/legacy/domain/games/last-call.js';
import { PissingContest } from '../static/js/legacy/domain/games/pissing-contest.js';
import { MessageBoard } from '../static/js/legacy/domain/games/message-board.js';
import { PayItForward } from '../static/js/legacy/domain/games/pay-it-forward.js';
import { PayItBackward } from '../static/js/legacy/domain/games/pay-it-backward.js';
import { DiceGods } from '../static/js/legacy/domain/games/dice-gods.js';
import { TimeToMakeTheDonuts } from '../static/js/legacy/domain/games/time-to-make-the-donuts.js';
import { SatanMolochBaal } from '../static/js/legacy/domain/games/satan-moloch-baal.js';

console.log('✅ All game modules imported successfully!');
console.log('');
console.log('Games validated:');
console.log('  ✓ King of the Hill');
console.log('  ✓ Last Call');
console.log('  ✓ Pissing Contest');
console.log('  ✓ Message Board');
console.log('  ✓ Pay It Forward');
console.log('  ✓ Pay It Backward');
console.log('  ✓ Dice Gods');
console.log('  ✓ Time to Make the Donuts');
console.log('  ✓ Satan, Moloch, Baal');
console.log('');
console.log('🎉 TransactionHandler import fix verified!');

