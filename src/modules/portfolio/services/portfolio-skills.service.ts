import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Skill, SkillDocument } from '../schemas/portfolio-skill.schema';
import { CreateSkillDto } from '../dto/skills/create-skill.dto';
import { UpdateSkillDto } from '../dto/skills/update-skill.dto';
import { bulkSoftDelete } from '../util/bulk-operations.util';

@Injectable()
export class PortfolioSkillsService {
    constructor(
        @InjectModel(Skill.name) private skillModel: Model<SkillDocument>,
    ) { }

    async create(userId: string, createSkillDto: CreateSkillDto): Promise<SkillDocument> {
        const skill = new this.skillModel({
            ...createSkillDto,
            userId: new Types.ObjectId(userId),
        });
        return skill.save();
    }

    async findAll(userId: string): Promise<{ [category: string]: SkillDocument[] }> {
        const skills = await this.skillModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ category: 1, order: 1 })
            .exec();

        // Group skills by category
        const grouped: { [category: string]: SkillDocument[] } = {};
        skills.forEach((skill) => {
            const category = skill.category || 'Other';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(skill);
        });

        return grouped;
    }

    async findAllFlat(userId: string): Promise<SkillDocument[]> {
        return this.skillModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ category: 1, order: 1 })
            .exec();
    }

    async findOne(userId: string, id: string): Promise<SkillDocument> {
        const skill = await this.skillModel.findById(id).exec();
        if (!skill) {
            throw new NotFoundException('Skill not found');
        }

        if (skill.userId.toString() !== userId) {
            throw new ForbiddenException('You can only access your own skills');
        }

        return skill;
    }

    async update(userId: string, id: string, updateSkillDto: UpdateSkillDto): Promise<SkillDocument> {
        const skill = await this.findOne(userId, id);
        Object.assign(skill, updateSkillDto);
        return skill.save();
    }

    async remove(userId: string, id: string): Promise<void> {
        const skill = await this.findOne(userId, id);
        // Soft delete
        (skill as any).deletedAt = new Date();
        await skill.save();
    }

    async bulkDelete(userId: string, ids: string[]): Promise<{ deletedCount: number; failedIds: string[] }> {
        return bulkSoftDelete(this.skillModel, userId, ids);
    }

    async reorder(userId: string, skillIds: string[]): Promise<void> {
        // Verify all skills belong to the user
        const skills = await this.skillModel.find({
            _id: { $in: skillIds.map((id) => new Types.ObjectId(id)) },
            userId: new Types.ObjectId(userId),
        }).exec();

        if (skills.length !== skillIds.length) {
            throw new ForbiddenException('Some skills not found or do not belong to you');
        }

        // Update order for each skill
        const updatePromises = skillIds.map((skillId, index) =>
            this.skillModel.findByIdAndUpdate(skillId, { order: index }).exec(),
        );

        await Promise.all(updatePromises);
    }

    async deleteAllByUserId(userId: string): Promise<number> {
        const result = await this.skillModel.deleteMany({
            userId: new Types.ObjectId(userId),
        }).exec();
        return result.deletedCount || 0;
    }
}
