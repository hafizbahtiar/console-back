import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from '../schemas/portfolio-project.schema';
import { CreateProjectDto } from '../dto/projects/create-project.dto';
import { UpdateProjectDto } from '../dto/projects/update-project.dto';
import { bulkSoftDelete } from '../util/bulk-operations.util';

@Injectable()
export class PortfolioProjectsService {
    constructor(
        @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    ) { }

    async create(userId: string, createProjectDto: CreateProjectDto): Promise<ProjectDocument> {
        const project = new this.projectModel({
            ...createProjectDto,
            userId: new Types.ObjectId(userId),
            startDate: createProjectDto.startDate ? new Date(createProjectDto.startDate) : undefined,
            endDate: createProjectDto.endDate ? new Date(createProjectDto.endDate) : undefined,
        });
        return project.save();
    }

    async findAll(userId: string, page: number = 1, limit: number = 10): Promise<{ projects: ProjectDocument[]; total: number; page: number; limit: number }> {
        const skip = (page - 1) * limit;
        const [projects, total] = await Promise.all([
            this.projectModel
                .find({ userId: new Types.ObjectId(userId) })
                .sort({ order: 1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.projectModel.countDocuments({ userId: new Types.ObjectId(userId) }).exec(),
        ]);

        return {
            projects,
            total,
            page,
            limit,
        };
    }

    async findOne(userId: string, id: string): Promise<ProjectDocument> {
        const project = await this.projectModel.findById(id).exec();
        if (!project) {
            throw new NotFoundException('Project not found');
        }

        if (project.userId.toString() !== userId) {
            throw new ForbiddenException('You can only access your own projects');
        }

        return project;
    }

    async update(userId: string, id: string, updateProjectDto: UpdateProjectDto): Promise<ProjectDocument> {
        const project = await this.findOne(userId, id);

        // Convert date strings to Date objects if provided
        const updateData: any = { ...updateProjectDto };
        if (updateProjectDto.startDate) {
            updateData.startDate = new Date(updateProjectDto.startDate);
        }
        if (updateProjectDto.endDate) {
            updateData.endDate = new Date(updateProjectDto.endDate);
        }

        Object.assign(project, updateData);
        return project.save();
    }

    async remove(userId: string, id: string): Promise<void> {
        const project = await this.findOne(userId, id);
        // Soft delete
        (project as any).deletedAt = new Date();
        await project.save();
    }

    async bulkDelete(userId: string, ids: string[]): Promise<{ deletedCount: number; failedIds: string[] }> {
        return bulkSoftDelete(this.projectModel, userId, ids);
    }

    async restore(userId: string, id: string): Promise<ProjectDocument> {
        const project = await this.projectModel.findOne({
            _id: new Types.ObjectId(id),
            userId: new Types.ObjectId(userId),
            deletedAt: { $ne: null },
        }).exec();

        if (!project) {
            throw new NotFoundException('Deleted project not found');
        }

        (project as any).deletedAt = null;
        return project.save();
    }

    async reorder(userId: string, projectIds: string[]): Promise<void> {
        // Verify all projects belong to the user (excluding soft-deleted)
        const projects = await this.projectModel.find({
            _id: { $in: projectIds.map((id) => new Types.ObjectId(id)) },
            userId: new Types.ObjectId(userId),
            deletedAt: null,
        }).exec();

        if (projects.length !== projectIds.length) {
            throw new ForbiddenException('Some projects not found or do not belong to you');
        }

        // Update order for each project
        const updatePromises = projectIds.map((projectId, index) =>
            this.projectModel.findByIdAndUpdate(projectId, { order: index }).exec(),
        );

        await Promise.all(updatePromises);
    }

    async deleteAllByUserId(userId: string): Promise<number> {
        const result = await this.projectModel.deleteMany({
            userId: new Types.ObjectId(userId),
        }).exec();
        return result.deletedCount || 0;
    }
}
