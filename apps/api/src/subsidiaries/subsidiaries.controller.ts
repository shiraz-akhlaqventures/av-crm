import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SubsidiariesService } from "./subsidiaries.service";
import type { Subsidiary } from "@av-crm/shared-types";

@UseGuards(JwtAuthGuard)
@Controller("subsidiaries")
export class SubsidiariesController {
  constructor(private readonly subsidiaries: SubsidiariesService) {}

  @Get()
  findAll(@Query("companyId") companyId?: string): Promise<Subsidiary[]> {
    return this.subsidiaries.findAll(companyId);
  }

  @Get(":id")
  findOne(@Param("id") id: string): Promise<Subsidiary | null> {
    return this.subsidiaries.findOne(id);
  }
}
