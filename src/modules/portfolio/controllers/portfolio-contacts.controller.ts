import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { PortfolioContactsService } from '../services/portfolio-contacts.service';
import { CreateContactDto } from '../dto/contacts/create-contact.dto';
import { UpdateContactDto } from '../dto/contacts/update-contact.dto';
import { ContactResponseDto } from '../dto/contacts/contact-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { plainToInstance } from 'class-transformer';
import {
    successResponse,
    createdResponse,
    paginatedResponse,
    noContentResponse,
    calculatePaginationMeta,
} from '../../../common/responses/response.util';
import { SuccessResponse, PaginatedResponse } from '../../../common/responses/response.interface';

@Controller('portfolio/contacts')
@UseGuards(JwtAuthGuard)
export class PortfolioContactsController {
    constructor(private readonly portfolioContactsService: PortfolioContactsService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @GetUser() user: any,
        @Body() createContactDto: CreateContactDto,
    ): Promise<SuccessResponse<ContactResponseDto>> {
        const contact = await this.portfolioContactsService.create(user.userId, createContactDto);
        const contactDto = plainToInstance(ContactResponseDto, contact.toObject(), {
            excludeExtraneousValues: true,
        });
        return createdResponse(contactDto, 'Contact link created successfully');
    }

    @Get()
    async findAll(
        @GetUser() user: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('activeOnly') activeOnly?: string,
    ): Promise<PaginatedResponse<ContactResponseDto>> {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;
        const activeOnlyBool = activeOnly === 'true';

        const result = await this.portfolioContactsService.findAll(user.userId, pageNum, limitNum, activeOnlyBool);
        const contacts = result.contacts.map((contact) =>
            plainToInstance(ContactResponseDto, contact.toObject(), {
                excludeExtraneousValues: true,
            }),
        );
        return paginatedResponse(
            contacts,
            calculatePaginationMeta(result.page, result.limit, result.total),
            'Contact links retrieved successfully',
        );
    }

    @Get(':id')
    async findOne(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<ContactResponseDto>> {
        const contact = await this.portfolioContactsService.findOne(user.userId, id);
        const contactDto = plainToInstance(ContactResponseDto, contact.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(contactDto, 'Contact link retrieved successfully');
    }

    @Patch(':id')
    async update(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() updateContactDto: UpdateContactDto,
    ): Promise<SuccessResponse<ContactResponseDto>> {
        const contact = await this.portfolioContactsService.update(user.userId, id, updateContactDto);
        const contactDto = plainToInstance(ContactResponseDto, contact.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(contactDto, 'Contact link updated successfully');
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@GetUser() user: any, @Param('id') id: string): Promise<null> {
        await this.portfolioContactsService.remove(user.userId, id);
        return noContentResponse();
    }

    @Patch('reorder')
    @HttpCode(HttpStatus.NO_CONTENT)
    async reorder(
        @GetUser() user: any,
        @Body() body: { contactIds: string[] },
    ): Promise<null> {
        await this.portfolioContactsService.reorder(user.userId, body.contactIds);
        return noContentResponse();
    }
}
