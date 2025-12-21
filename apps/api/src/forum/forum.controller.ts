import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { ForumService } from './forum.service';
import { PaginationDto } from '../common/pagination/dto/pagination.dto';
import { PaginationResult } from '../common/pagination/dto/paginationResult';
import { ForumDto } from './dto/forum.dto';
import { plainToInstance } from 'class-transformer';
import { AuthGuard } from '../auth/auth.guard';
import { ParseObjectIdPipe } from '../validators/parseObjectId.pipe';
import { MessageDto } from './message/dto/messageDto';
import { CreateMessageDto } from './message/dto/createMessageDto';
import { MessageService } from './message/message.service';

@UseGuards(AuthGuard)
@Controller('/api/forum')
export class ForumController {
    constructor(
        private readonly forumService: ForumService,
        private readonly messageService: MessageService,
    ) {}

    /**
     * Return a paginated list of forums. Query parameters `page` and `limit`
     * are read via `PaginationDto` and validated automatically.
     * @param query - Pagination parameters (page, limit)
     * @returns A paginated result containing `ForumDto` instances
     */
    @Get('all')
    @HttpCode(HttpStatus.OK)
    async findAllForums(
        @Query(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
        query: PaginationDto,
    ): Promise<PaginationResult<ForumDto>> {
        const forums = await this.forumService.findAll(query);

        return {
            ...forums,
            data: forums.data.map((forum) => plainToInstance(ForumDto, forum)),
        };
    }

    /**
     * Find the general forum (without a company id).
     * @returns The general forum if found, otherwise null.
     */
    @Get('general')
    @HttpCode(HttpStatus.OK)
    async getGeneralForum(): Promise<ForumDto | null> {
        return plainToInstance(ForumDto, await this.forumService.findOneByCompanyId());
    }

    /**
     * Find a forum by company id.
     * @param companyId - The company id to search for. If not provided, searches for the general forum.
     * @returns The forum if found, otherwise null.
     */
    @Get('by-company-id/:companyId')
    @HttpCode(HttpStatus.OK)
    async findOneByCompanyId(@Param('companyId', ParseObjectIdPipe) companyId?: string): Promise<ForumDto | null> {
        return plainToInstance(ForumDto, await this.forumService.findOneByCompanyId(companyId));
    }

    @Post('/topic/:topicId/message/create')
    @HttpCode(HttpStatus.OK)
    async sendMessage(
        @Param('topicId', ParseObjectIdPipe) topicId: string,
        @Body() messageDto: CreateMessageDto,
    ): Promise<MessageDto> {
        return plainToInstance(MessageDto, await this.messageService.sendMessage(topicId, messageDto));
    }
}
