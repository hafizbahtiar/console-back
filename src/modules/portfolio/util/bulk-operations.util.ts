/**
 * Utility functions for bulk operations on portfolio items
 */
import { Model, Types } from 'mongoose';
import { ForbiddenException } from '@nestjs/common';

export interface BulkDeleteResult {
  deletedCount: number;
  failedIds: string[];
}

export interface BulkUpdateResult {
  updatedCount: number;
  failedIds: string[];
}

/**
 * Bulk soft delete items
 */
export async function bulkSoftDelete<T>(
  model: Model<T>,
  userId: string,
  ids: string[],
): Promise<BulkDeleteResult> {
  const objectIds = ids.map((id) => new Types.ObjectId(id));
  
  // Verify all items belong to the user
  const items = await (model as any).find({
    _id: { $in: objectIds },
    userId: new Types.ObjectId(userId),
    deletedAt: null, // Only delete non-deleted items
  }).exec();

  if (items.length === 0) {
    throw new ForbiddenException('No items found or they do not belong to you');
  }

  const foundIds = items.map((item: any) => item._id.toString());
  const failedIds = ids.filter((id) => !foundIds.includes(id));

  // Soft delete all found items
  const deletedAt = new Date();
  await (model as any).updateMany(
    { _id: { $in: items.map((item: any) => item._id) } },
    { $set: { deletedAt } },
  ).exec();

  return {
    deletedCount: items.length,
    failedIds,
  };
}

/**
 * Bulk hard delete items (permanent deletion)
 */
export async function bulkHardDelete<T>(
  model: Model<T>,
  userId: string,
  ids: string[],
): Promise<BulkDeleteResult> {
  const objectIds = ids.map((id) => new Types.ObjectId(id));
  
  // Verify all items belong to the user
  const items = await (model as any).find({
    _id: { $in: objectIds },
    userId: new Types.ObjectId(userId),
  }).exec();

  if (items.length === 0) {
    throw new ForbiddenException('No items found or they do not belong to you');
  }

  const foundIds = items.map((item: any) => item._id.toString());
  const failedIds = ids.filter((id) => !foundIds.includes(id));

  // Hard delete all found items
  await (model as any).deleteMany({
    _id: { $in: items.map((item: any) => item._id) },
  }).exec();

  return {
    deletedCount: items.length,
    failedIds,
  };
}

/**
 * Bulk restore soft-deleted items
 */
export async function bulkRestore<T>(
  model: Model<T>,
  userId: string,
  ids: string[],
): Promise<BulkUpdateResult> {
  const objectIds = ids.map((id) => new Types.ObjectId(id));
  
  // Find soft-deleted items that belong to the user
  const items = await (model as any).find({
    _id: { $in: objectIds },
    userId: new Types.ObjectId(userId),
    deletedAt: { $ne: null },
  }).exec();

  if (items.length === 0) {
    throw new ForbiddenException('No deleted items found or they do not belong to you');
  }

  const foundIds = items.map((item: any) => item._id.toString());
  const failedIds = ids.filter((id) => !foundIds.includes(id));

  // Restore all found items
  await (model as any).updateMany(
    { _id: { $in: items.map((item: any) => item._id) } },
    { $set: { deletedAt: null } },
  ).exec();

  return {
    updatedCount: items.length,
    failedIds,
  };
}

