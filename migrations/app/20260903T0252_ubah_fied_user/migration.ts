#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/223d4812ed316e4d9448410303f4a4dbb8396c0443d846646f0fad12320980fa/contract';
import endContract from '../../snapshots/223d4812ed316e4d9448410303f4a4dbb8396c0443d846646f0fad12320980fa/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/d524c380bd51fdda9e1172ea031aa30784e30a502f45946e4352117922ffd382/contract';
import startContract from '../../snapshots/d524c380bd51fdda9e1172ea031aa30784e30a502f45946e4352117922ffd382/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({ schema: 'public', table: 'User', column: 'profilePicture' }),
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('profile', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
