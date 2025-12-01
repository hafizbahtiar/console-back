import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Contact, ContactDocument } from '../schemas/portfolio-contact.schema';
import { CreateContactDto } from '../dto/contacts/create-contact.dto';
import { UpdateContactDto } from '../dto/contacts/update-contact.dto';

@Injectable()
export class PortfolioContactsService {
    constructor(
        @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
    ) { }

    async create(userId: string, createContactDto: CreateContactDto): Promise<ContactDocument> {
        const contact = new this.contactModel({
            ...createContactDto,
            userId: new Types.ObjectId(userId),
        });
        return contact.save();
    }

    async findAll(
        userId: string,
        page: number = 1,
        limit: number = 10,
        activeOnly?: boolean,
        includeDeleted = false,
    ): Promise<{ contacts: ContactDocument[]; total: number; page: number; limit: number }> {
        const skip = (page - 1) * limit;
        const queryFilter: any = { userId: new Types.ObjectId(userId) };

        if (activeOnly) {
            queryFilter.active = true;
        }

        if (!includeDeleted) {
            queryFilter.deletedAt = null;
        }

        const [contacts, total] = await Promise.all([
            this.contactModel
                .find(queryFilter)
                .sort({ active: -1, order: 1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.contactModel.countDocuments(queryFilter).exec(),
        ]);

        return {
            contacts,
            total,
            page,
            limit,
        };
    }

    async findOne(userId: string, id: string): Promise<ContactDocument> {
        const contact = await this.contactModel.findById(id).exec();
        if (!contact) {
            throw new NotFoundException('Contact link not found');
        }

        if (contact.userId.toString() !== userId) {
            throw new ForbiddenException('You can only access your own contact links');
        }

        return contact;
    }

    async update(userId: string, id: string, updateContactDto: UpdateContactDto): Promise<ContactDocument> {
        const contact = await this.findOne(userId, id);
        Object.assign(contact, updateContactDto);
        return contact.save();
    }

    async remove(userId: string, id: string): Promise<void> {
        await this.findOne(userId, id);
        await this.contactModel.findByIdAndDelete(id).exec();
    }

    async reorder(userId: string, contactIds: string[]): Promise<void> {
        // Verify all contacts belong to the user
        const contacts = await this.contactModel.find({
            _id: { $in: contactIds.map((id) => new Types.ObjectId(id)) },
            userId: new Types.ObjectId(userId),
        }).exec();

        if (contacts.length !== contactIds.length) {
            throw new ForbiddenException('Some contact links not found or do not belong to you');
        }

        // Update order for each contact
        const updatePromises = contactIds.map((contactId, index) =>
            this.contactModel.findByIdAndUpdate(contactId, { order: index }).exec(),
        );

        await Promise.all(updatePromises);
    }

    async deleteAllByUserId(userId: string): Promise<number> {
        const result = await this.contactModel.deleteMany({
            userId: new Types.ObjectId(userId),
        }).exec();
        return result.deletedCount || 0;
    }
}
