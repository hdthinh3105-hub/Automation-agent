import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class CustomerResponseDto {
  id!: string;
  email!: string;
  name!: string | null;
  phone!: string | null;
  firstSeenAt!: Date;
}
