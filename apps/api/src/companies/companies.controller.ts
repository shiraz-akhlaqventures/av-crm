import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CompaniesService } from "./companies.service";
import type { Company } from "@av-crm/shared-types";

@UseGuards(JwtAuthGuard)
@Controller("companies")
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  findAll(): Promise<Company[]> {
    return this.companies.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string): Promise<Company | null> {
    return this.companies.findOne(id);
  }
}
