// This file is made to check everyday for posts set as "deleted". If they were set as "deleted" for 30 days, they get removed from the database.
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PostService } from './post.service';

@Injectable()
export class PostCleanup {
  private readonly logger = new Logger(PostCleanup.name);

  constructor(private readonly postService: PostService) {}

  // @Cron('*/30 * * * * *')   // Every 30 seconds (for testing)
  @Cron(process.env.CLEANUP_CRON || '0 3 * * *')   // Everyday at 3AM
  async deleteExpired() {
    this.logger.log('Auto-cleanup of soft-deleted posts...');
    await this.postService.deleteExpiredPosts();
    this.logger.log('Posts cleanup completed.');
  }
}
