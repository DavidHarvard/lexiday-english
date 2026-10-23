import {initAccount} from './account-store.js';
import {mountAccountUI} from './account-ui.js';
await initAccount();
await import('./app.js');
mountAccountUI();
