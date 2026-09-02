#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/4500125ad9a4ebbb471b2b64eb44d29cb4badbe534c089ce328c5d168322207a/contract';
import endContract from '../../snapshots/4500125ad9a4ebbb471b2b64eb44d29cb4badbe534c089ce328c5d168322207a/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/8ee01b02869c34d67e06edae37083fddfd3b11b8f954e4e3ed8f96d8032164c9/contract';
import startContract from '../../snapshots/8ee01b02869c34d67e06edae37083fddfd3b11b8f954e4e3ed8f96d8032164c9/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.setDefault({
        schema: 'public',
        table: 'MobilPushSubscription',
        column: 'updatedAt',
        defaultSql: 'DEFAULT (now())',
      }),
      this.setDefault({
        schema: 'public',
        table: 'Session',
        column: 'updatedAt',
        defaultSql: 'DEFAULT (now())',
      }),
      this.setDefault({
        schema: 'public',
        table: 'User',
        column: 'updatedAt',
        defaultSql: 'DEFAULT (now())',
      }),
      this.setDefault({
        schema: 'public',
        table: 'WebPushSubscription',
        column: 'updatedAt',
        defaultSql: 'DEFAULT (now())',
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
