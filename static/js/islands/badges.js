import { boot } from './shell.js';

const ctx = await boot({ walletHost: '#badges-island .island-bar' });
const { BadgeManager } = await import('../legacy/domain/identity/badge-manager.js');
await new BadgeManager().init(ctx.web3Provider);
