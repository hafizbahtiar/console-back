import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Testimonial, TestimonialDocument } from '../schemas/portfolio-testimonial.schema';
import { CreateTestimonialDto } from '../dto/testimonials/create-testimonial.dto';
import { UpdateTestimonialDto } from '../dto/testimonials/update-testimonial.dto';

@Injectable()
export class PortfolioTestimonialsService {
    constructor(
        @InjectModel(Testimonial.name) private testimonialModel: Model<TestimonialDocument>,
    ) { }

    async create(userId: string, createTestimonialDto: CreateTestimonialDto): Promise<TestimonialDocument> {
        const testimonial = new this.testimonialModel({
            ...createTestimonialDto,
            userId: new Types.ObjectId(userId),
        });
        return testimonial.save();
    }

    async findAll(
        userId: string,
        page: number = 1,
        limit: number = 10,
        includeDeleted = false,
    ): Promise<{ testimonials: TestimonialDocument[]; total: number; page: number; limit: number }> {
        const skip = (page - 1) * limit;
        const queryFilter: any = { userId: new Types.ObjectId(userId) };

        if (!includeDeleted) {
            queryFilter.deletedAt = null;
        }

        const [testimonials, total] = await Promise.all([
            this.testimonialModel
                .find(queryFilter)
                .sort({ featured: -1, order: 1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.testimonialModel.countDocuments(queryFilter).exec(),
        ]);

        return {
            testimonials,
            total,
            page,
            limit,
        };
    }

    async findOne(userId: string, id: string): Promise<TestimonialDocument> {
        const testimonial = await this.testimonialModel.findById(id).exec();
        if (!testimonial) {
            throw new NotFoundException('Testimonial not found');
        }

        if (testimonial.userId.toString() !== userId) {
            throw new ForbiddenException('You can only access your own testimonials');
        }

        return testimonial;
    }

    async update(userId: string, id: string, updateTestimonialDto: UpdateTestimonialDto): Promise<TestimonialDocument> {
        const testimonial = await this.findOne(userId, id);
        Object.assign(testimonial, updateTestimonialDto);
        return testimonial.save();
    }

    async remove(userId: string, id: string): Promise<void> {
        await this.findOne(userId, id);
        await this.testimonialModel.findByIdAndDelete(id).exec();
    }

    async reorder(userId: string, testimonialIds: string[]): Promise<void> {
        // Verify all testimonials belong to the user
        const testimonials = await this.testimonialModel.find({
            _id: { $in: testimonialIds.map((id) => new Types.ObjectId(id)) },
            userId: new Types.ObjectId(userId),
        }).exec();

        if (testimonials.length !== testimonialIds.length) {
            throw new ForbiddenException('Some testimonials not found or do not belong to you');
        }

        // Update order for each testimonial
        const updatePromises = testimonialIds.map((testimonialId, index) =>
            this.testimonialModel.findByIdAndUpdate(testimonialId, { order: index }).exec(),
        );

        await Promise.all(updatePromises);
    }

    async deleteAllByUserId(userId: string): Promise<number> {
        const result = await this.testimonialModel.deleteMany({
            userId: new Types.ObjectId(userId),
        }).exec();
        return result.deletedCount || 0;
    }
}
