import { IsEnum, IsOptional } from 'class-validator';

export class UpdateReportDto {
    @IsOptional()
    @IsEnum(['pending', 'reviewed', 'resolved', 'rejected'])
    status?: string;
}
