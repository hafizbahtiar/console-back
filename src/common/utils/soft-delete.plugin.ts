/**
 * Soft delete plugin for Mongoose schemas
 * Adds deletedAt field and modifies queries to exclude soft-deleted documents
 */
import { Schema } from 'mongoose';

export function softDeletePlugin(schema: Schema) {
  // Add deletedAt field
  schema.add({
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  });

  // Add isDeleted virtual
  schema.virtual('isDeleted').get(function () {
    return this.deletedAt !== null;
  });

  // Modify find queries to exclude soft-deleted documents by default
  const excludeDeleted = function (this: any) {
    const query = this.getQuery();
    if (query.deletedAt === undefined && !query.includeDeleted) {
      query.deletedAt = null;
    }
    delete query.includeDeleted;
  };

  schema.pre('find', excludeDeleted);
  schema.pre('findOne', excludeDeleted);
  schema.pre('findOneAndUpdate', excludeDeleted);
  schema.pre('countDocuments', excludeDeleted);
  schema.pre('distinct', excludeDeleted);

  // Add soft delete method
  schema.methods.softDelete = function () {
    this.deletedAt = new Date();
    return this.save();
  };

  // Add restore method
  schema.methods.restore = function () {
    this.deletedAt = null;
    return this.save();
  };

  // Add static method to find including deleted
  schema.statics.findWithDeleted = function (conditions: any = {}) {
    return this.find({ ...conditions, includeDeleted: true });
  };

  // Add static method to find only deleted
  schema.statics.findDeleted = function (conditions: any = {}) {
    return this.find({ ...conditions, deletedAt: { $ne: null } });
  };
}

