import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsDateString,
  IsPhoneNumber,
} from 'class-validator';

export class CreateResumeDto {
  @IsNumber()
  user_id: number | undefined;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  work_schedule?: string;

  @IsString()
  @IsOptional()
  payment_period?: string;

  @IsNumber()
  @IsOptional()
  salary_net?: number;

  @IsDateString()
  @IsOptional()
  birth_date?: string;

  @IsString()
  @IsOptional()
  phone_number?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  education?: string;

  @IsString()
  @IsOptional()
  work_experience?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsString()
  @IsOptional()
  personal_qualities?: string;

  @IsString()
  @IsOptional()
  photo?: string;
}
