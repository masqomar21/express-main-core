#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/4500125ad9a4ebbb471b2b64eb44d29cb4badbe534c089ce328c5d168322207a/contract';
import startContract from '../../snapshots/4500125ad9a4ebbb471b2b64eb44d29cb4badbe534c089ce328c5d168322207a/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/d524c380bd51fdda9e1172ea031aa30784e30a502f45946e4352117922ffd382/contract';
import endContract from '../../snapshots/d524c380bd51fdda9e1172ea031aa30784e30a502f45946e4352117922ffd382/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('isActive', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('profilePicture', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
