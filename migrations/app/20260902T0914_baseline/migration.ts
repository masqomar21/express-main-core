#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/8ee01b02869c34d67e06edae37083fddfd3b11b8f954e4e3ed8f96d8032164c9/contract';
import endContract from '../../snapshots/8ee01b02869c34d67e06edae37083fddfd3b11b8f954e4e3ed8f96d8032164c9/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'OtpPurpose',
        members: ['LOGIN', 'RESET_PASSWORD', 'VERIFY_EMAIL'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'Process',
        members: ['CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOGIN', 'LOGOUT'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'RoleType',
        members: ['OTHER', 'SUPER_ADMIN'],
      }),
      this.createTable({
        schema: 'public',
        table: 'Loger',
        columns: [
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('detail', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('process', '"Process"', {
            notNull: true,
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'Process' } },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'], { name: 'Loger_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'MobilPushSubscription',
        columns: [
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('token', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'], { name: 'MobilPushSubscription_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'Notification',
        columns: [
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('message', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('refId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'], { name: 'Notification_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'NotificationUser',
        columns: [
          col('deliveredAt', 'timestamp(3)', {
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('notificationId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('readAt', 'timestamp(3)', {
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('readStatus', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'], { name: 'NotificationUser_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'Otp',
        columns: [
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('expiresAt', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('purpose', '"OtpPurpose"', {
            notNull: true,
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'OtpPurpose' } },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'], { name: 'Otp_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'Permissions',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('label', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'], { name: 'Permissions_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'Role',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('roleType', '"RoleType"', {
            notNull: true,
            default: lit('OTHER'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'RoleType' } },
          }),
        ],
        constraints: [primaryKey(['id'], { name: 'Role_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'RolePermission',
        columns: [
          col('canDelete', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('canRead', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('canRestore', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('canUpdate', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('canWrite', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('permissionId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('roleId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'], { name: 'RolePermission_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'Session',
        columns: [
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('deletedAt', 'timestamp(3)', {
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('token', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'], { name: 'Session_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'User',
        columns: [
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('deletedAt', 'timestamp(3)', {
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('password', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('registeredViaGoogle', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('roleId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'], { name: 'User_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'WebPushSubscription',
        columns: [
          col('auth', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('endpoint', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('expirationTime', 'timestamp(3)', {
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('p256dh', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('userAgent', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'], { name: 'WebPushSubscription_pkey' })],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Otp',
        constraint: 'Otp_userId_key',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'MobilPushSubscription',
        index: 'MobilPushSubscription_token_key',
        columns: ['token'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'MobilPushSubscription',
        index: 'MobilPushSubscription_userId_idx',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'NotificationUser',
        index: 'NotificationUser_notificationId_idx',
        columns: ['notificationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'NotificationUser',
        index: 'NotificationUser_userId_notificationId_key',
        columns: ['userId', 'notificationId'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'NotificationUser',
        index: 'NotificationUser_userId_readStatus_idx',
        columns: ['userId', 'readStatus'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Otp',
        index: 'Otp_code_key',
        columns: ['code'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'Session',
        index: 'Session_token_key',
        columns: ['token'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'User',
        index: 'User_email_key',
        columns: ['email'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'WebPushSubscription',
        index: 'WebPushSubscription_endpoint_key',
        columns: ['endpoint'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'WebPushSubscription',
        index: 'WebPushSubscription_userId_idx',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Loger',
        foreignKey: {
          name: 'Loger_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'MobilPushSubscription',
        foreignKey: {
          name: 'MobilPushSubscription_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
          onDelete: 'cascade',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'NotificationUser',
        foreignKey: {
          name: 'NotificationUser_notificationId_fkey',
          columns: ['notificationId'],
          references: { schema: 'public', table: 'Notification', columns: ['id'] },
          onDelete: 'cascade',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'NotificationUser',
        foreignKey: {
          name: 'NotificationUser_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
          onDelete: 'cascade',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Otp',
        foreignKey: {
          name: 'Otp_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'RolePermission',
        foreignKey: {
          name: 'RolePermission_permissionId_fkey',
          columns: ['permissionId'],
          references: { schema: 'public', table: 'Permissions', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'RolePermission',
        foreignKey: {
          name: 'RolePermission_roleId_fkey',
          columns: ['roleId'],
          references: { schema: 'public', table: 'Role', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Session',
        foreignKey: {
          name: 'Session_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'User',
        foreignKey: {
          name: 'User_roleId_fkey',
          columns: ['roleId'],
          references: { schema: 'public', table: 'Role', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'WebPushSubscription',
        foreignKey: {
          name: 'WebPushSubscription_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
          onDelete: 'cascade',
          onUpdate: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
