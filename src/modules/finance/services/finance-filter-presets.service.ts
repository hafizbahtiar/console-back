import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FilterPreset, FilterPresetDocument } from '../schemas/finance-filter-preset.schema';
import { CreateFilterPresetDto } from '../dto/filter-presets/create-filter-preset.dto';
import { UpdateFilterPresetDto } from '../dto/filter-presets/update-filter-preset.dto';
import { bulkSoftDelete } from '../../portfolio/util/bulk-operations.util';

@Injectable()
export class FinanceFilterPresetsService {
    constructor(
        @InjectModel(FilterPreset.name) private filterPresetModel: Model<FilterPresetDocument>,
    ) { }

    async create(userId: string, createFilterPresetDto: CreateFilterPresetDto): Promise<FilterPresetDocument> {
        // If this is set as default, unset other defaults for this user
        if (createFilterPresetDto.isDefault) {
            await this.filterPresetModel.updateMany(
                { userId: new Types.ObjectId(userId) },
                { isDefault: false },
            ).exec();
        }

        const filterPreset = new this.filterPresetModel({
            ...createFilterPresetDto,
            userId: new Types.ObjectId(userId),
            isDefault: createFilterPresetDto.isDefault || false,
        });
        return filterPreset.save();
    }

    async findAll(userId: string): Promise<FilterPresetDocument[]> {
        return this.filterPresetModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ isDefault: -1, createdAt: -1 })
            .exec();
    }

    async findOne(userId: string, id: string): Promise<FilterPresetDocument> {
        const filterPreset = await this.filterPresetModel.findById(id).exec();
        if (!filterPreset) {
            throw new NotFoundException('Filter preset not found');
        }

        if (filterPreset.userId.toString() !== userId) {
            throw new ForbiddenException('You can only access your own filter presets');
        }

        return filterPreset;
    }

    async update(userId: string, id: string, updateFilterPresetDto: UpdateFilterPresetDto): Promise<FilterPresetDocument> {
        const filterPreset = await this.findOne(userId, id);

        // If setting as default, unset other defaults for this user
        if (updateFilterPresetDto.isDefault === true) {
            await this.filterPresetModel.updateMany(
                { userId: new Types.ObjectId(userId), _id: { $ne: new Types.ObjectId(id) } },
                { isDefault: false },
            ).exec();
        }

        Object.assign(filterPreset, updateFilterPresetDto);
        return filterPreset.save();
    }

    async remove(userId: string, id: string): Promise<void> {
        const filterPreset = await this.findOne(userId, id);
        
        // Don't allow deleting the default preset
        if (filterPreset.isDefault) {
            throw new BadRequestException('Cannot delete the default filter preset. Please set another preset as default first.');
        }

        // Soft delete
        (filterPreset as any).deletedAt = new Date();
        await filterPreset.save();
    }

    async bulkDelete(userId: string, ids: string[]): Promise<{ deletedCount: number; failedIds: string[] }> {
        // Check if any of the presets to delete is the default
        const presets = await this.filterPresetModel.find({
            _id: { $in: ids.map((id) => new Types.ObjectId(id)) },
            userId: new Types.ObjectId(userId),
        }).exec();

        const defaultPresets = presets.filter((p) => p.isDefault);
        if (defaultPresets.length > 0) {
            throw new BadRequestException(
                `Cannot delete default filter presets. Please set another preset as default first.`,
            );
        }

        return bulkSoftDelete(this.filterPresetModel, userId, ids);
    }

    async restore(userId: string, id: string): Promise<FilterPresetDocument> {
        const filterPreset = await this.filterPresetModel.findOne({
            _id: new Types.ObjectId(id),
            userId: new Types.ObjectId(userId),
            deletedAt: { $ne: null },
        }).exec();

        if (!filterPreset) {
            throw new NotFoundException('Deleted filter preset not found');
        }

        (filterPreset as any).deletedAt = null;
        return filterPreset.save();
    }

    async setDefault(userId: string, id: string): Promise<FilterPresetDocument> {
        const filterPreset = await this.findOne(userId, id);

        // Unset other defaults
        await this.filterPresetModel.updateMany(
            { userId: new Types.ObjectId(userId), _id: { $ne: new Types.ObjectId(id) } },
            { isDefault: false },
        ).exec();

        filterPreset.isDefault = true;
        return filterPreset.save();
    }

    async getDefault(userId: string): Promise<FilterPresetDocument | null> {
        return this.filterPresetModel
            .findOne({
                userId: new Types.ObjectId(userId),
                isDefault: true,
            })
            .exec();
    }
}

