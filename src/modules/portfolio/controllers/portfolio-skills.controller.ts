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
import { PortfolioSkillsService } from '../services/portfolio-skills.service';
import { CreateSkillDto } from '../dto/skills/create-skill.dto';
import { UpdateSkillDto } from '../dto/skills/update-skill.dto';
import { SkillResponseDto } from '../dto/skills/skill-response.dto';
import { BulkDeleteSkillDto } from '../dto/skills/bulk-delete-skill.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { plainToInstance } from 'class-transformer';
import {
    successResponse,
    createdResponse,
    noContentResponse,
} from '../../../common/responses/response.util';
import { SuccessResponse } from '../../../common/responses/response.interface';

@Controller('portfolio/skills')
@UseGuards(JwtAuthGuard)
export class PortfolioSkillsController {
    constructor(private readonly portfolioSkillsService: PortfolioSkillsService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @GetUser() user: any,
        @Body() createSkillDto: CreateSkillDto,
    ): Promise<SuccessResponse<SkillResponseDto>> {
        const skill = await this.portfolioSkillsService.create(user.userId, createSkillDto);
        const skillDto = plainToInstance(SkillResponseDto, skill.toObject(), {
            excludeExtraneousValues: true,
        });
        return createdResponse(skillDto, 'Skill created successfully');
    }

    @Get()
    async findAll(
        @GetUser() user: any,
        @Query('grouped') grouped?: string,
    ): Promise<SuccessResponse<{ [category: string]: SkillResponseDto[] } | SkillResponseDto[]>> {
        if (grouped === 'true') {
            const groupedSkills = await this.portfolioSkillsService.findAll(user.userId);
            const result: { [category: string]: SkillResponseDto[] } = {};
            Object.keys(groupedSkills).forEach((category) => {
                result[category] = groupedSkills[category].map((skill) =>
                    plainToInstance(SkillResponseDto, skill.toObject(), {
                        excludeExtraneousValues: true,
                    }),
                );
            });
            return successResponse(result, 'Skills retrieved successfully (grouped)');
        }

        const skills = await this.portfolioSkillsService.findAllFlat(user.userId);
        const skillsDto = skills.map((skill) =>
            plainToInstance(SkillResponseDto, skill.toObject(), {
                excludeExtraneousValues: true,
            }),
        );
        return successResponse(skillsDto, 'Skills retrieved successfully');
    }

    @Get(':id')
    async findOne(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<SkillResponseDto>> {
        const skill = await this.portfolioSkillsService.findOne(user.userId, id);
        const skillDto = plainToInstance(SkillResponseDto, skill.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(skillDto, 'Skill retrieved successfully');
    }

    @Patch(':id')
    async update(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() updateSkillDto: UpdateSkillDto,
    ): Promise<SuccessResponse<SkillResponseDto>> {
        const skill = await this.portfolioSkillsService.update(user.userId, id, updateSkillDto);
        const skillDto = plainToInstance(SkillResponseDto, skill.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(skillDto, 'Skill updated successfully');
    }

    @Post('bulk-delete')
    @HttpCode(HttpStatus.OK)
    async bulkDelete(
        @GetUser() user: any,
        @Body() bulkDeleteDto: BulkDeleteSkillDto,
    ): Promise<SuccessResponse<{ deletedCount: number; failedIds: string[] }>> {
        const result = await this.portfolioSkillsService.bulkDelete(user.userId, bulkDeleteDto.ids);
        return successResponse(result, `Successfully deleted ${result.deletedCount} skill(s)`);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@GetUser() user: any, @Param('id') id: string): Promise<null> {
        await this.portfolioSkillsService.remove(user.userId, id);
        return noContentResponse();
    }

    @Patch('reorder')
    @HttpCode(HttpStatus.NO_CONTENT)
    async reorder(
        @GetUser() user: any,
        @Body() body: { skillIds: string[] },
    ): Promise<null> {
        await this.portfolioSkillsService.reorder(user.userId, body.skillIds);
        return noContentResponse();
    }
}
