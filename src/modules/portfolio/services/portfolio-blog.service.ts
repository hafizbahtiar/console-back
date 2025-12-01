import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Blog, BlogDocument } from '../schemas/portfolio-blog.schema';
import { CreateBlogDto } from '../dto/blog/create-blog.dto';
import { UpdateBlogDto } from '../dto/blog/update-blog.dto';
import { generateSlug, generateUniqueSlug } from '../util/portfolio-blog.util';

@Injectable()
export class PortfolioBlogService {
    constructor(
        @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
    ) { }

    async create(userId: string, createBlogDto: CreateBlogDto): Promise<BlogDocument> {
        // Generate slug if not provided
        let slug = createBlogDto.slug || generateSlug(createBlogDto.title);

        // Ensure slug is unique
        const checkSlugExists = async (s: string) => {
            const existing = await this.blogModel.findOne({ slug: s }).exec();
            return !!existing;
        };

        slug = await generateUniqueSlug(slug, checkSlugExists);

        const blog = new this.blogModel({
            ...createBlogDto,
            slug,
            userId: new Types.ObjectId(userId),
            publishedAt: createBlogDto.published ? new Date() : undefined,
        });

        return blog.save();
    }

    async findAll(userId: string, page: number = 1, limit: number = 10, published?: boolean): Promise<{ posts: BlogDocument[]; total: number; page: number; limit: number }> {
        const skip = (page - 1) * limit;
        const query: any = { userId: new Types.ObjectId(userId) };

        // Filter by published status if specified
        if (published !== undefined) {
            query.published = published;
        }

        const [posts, total] = await Promise.all([
            this.blogModel
                .find(query)
                .sort({ publishedAt: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.blogModel.countDocuments(query).exec(),
        ]);

        return {
            posts,
            total,
            page,
            limit,
        };
    }

    async findOne(userId: string, idOrSlug: string): Promise<BlogDocument> {
        // Try to find by ID first, then by slug
        const isObjectId = Types.ObjectId.isValid(idOrSlug);
        const query = isObjectId
            ? { _id: new Types.ObjectId(idOrSlug) }
            : { slug: idOrSlug };

        const blog = await this.blogModel.findOne(query).exec();
        if (!blog) {
            throw new NotFoundException('Blog post not found');
        }

        if (blog.userId.toString() !== userId) {
            throw new ForbiddenException('You can only access your own blog posts');
        }

        return blog;
    }

    async update(userId: string, id: string, updateBlogDto: UpdateBlogDto): Promise<BlogDocument> {
        const blog = await this.findOne(userId, id);

        // Handle slug update if provided
        if (updateBlogDto.slug) {
            const newSlug = updateBlogDto.slug.toLowerCase().trim();
            // Check if slug is different and already exists
            if (newSlug !== blog.slug) {
                const existing = await this.blogModel.findOne({ slug: newSlug }).exec();
                if (existing && existing._id.toString() !== id) {
                    throw new ConflictException('Slug already exists');
                }
                updateBlogDto.slug = newSlug;
            }
        }

        // Handle title update - regenerate slug if title changed and slug not provided
        if (updateBlogDto.title && !updateBlogDto.slug && updateBlogDto.title !== blog.title) {
            const newSlug = generateSlug(updateBlogDto.title);
            const checkSlugExists = async (s: string) => {
                const existing = await this.blogModel.findOne({ slug: s, _id: { $ne: new Types.ObjectId(id) } }).exec();
                return !!existing;
            };
            updateBlogDto.slug = await generateUniqueSlug(newSlug, checkSlugExists);
        }

        Object.assign(blog, updateBlogDto);
        return blog.save();
    }

    async remove(userId: string, id: string): Promise<void> {
        await this.findOne(userId, id);
        await this.blogModel.findByIdAndDelete(id).exec();
    }

    async publish(userId: string, id: string, published: boolean): Promise<BlogDocument> {
        const blog = await this.findOne(userId, id);
        blog.published = published;
        blog.publishedAt = published ? new Date() : undefined;
        return blog.save();
    }

    async deleteAllByUserId(userId: string): Promise<number> {
        const result = await this.blogModel.deleteMany({
            userId: new Types.ObjectId(userId),
        }).exec();
        return result.deletedCount || 0;
    }
}
