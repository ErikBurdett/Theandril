import { writeFile } from 'node:fs/promises';
import { exportSave } from '@theandril/persistence';
import { serializeGame } from '@theandril/sim';
import { borderBattleCampaign } from '../../../packages/test-fixtures/src/combat-fixture';

// Authored border-battle input only; all commands in the clean browser are public.
await writeFile(new URL('./border-battle.theandril', import.meta.url), await exportSave(serializeGame(borderBattleCampaign())));
