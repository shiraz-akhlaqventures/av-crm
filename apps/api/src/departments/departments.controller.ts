import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { DepartmentsService } from "./departments.service";
import type { Department } from "@av-crm/shared-types";

@UseGuards(JwtAuthGuard)
@Controller("departments")
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  @Get()
  findAll(
    @Query("companyId") companyId?: string,
    @Query("subsidiaryId") subsidiaryId?: string,
  ): Promise<Department[]> {
    return this.departments.findAll({ companyId, subsidiaryId });
  }

  @Get(":id")
  findOne(@Param("id") id: string): Promise<Department | null> {
    return this.departments.findOne(id);
  }
}
