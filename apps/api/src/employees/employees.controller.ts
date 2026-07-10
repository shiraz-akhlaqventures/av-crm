import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { EmployeesService } from "./employees.service";
import type { Employee } from "@av-crm/shared-types";

@UseGuards(JwtAuthGuard)
@Controller("employees")
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  findAll(
    @Query("companyId") companyId?: string,
    @Query("subsidiaryId") subsidiaryId?: string,
    @Query("departmentId") departmentId?: string,
  ): Promise<Employee[]> {
    return this.employees.findAll({ companyId, subsidiaryId, departmentId });
  }

  @Get(":id")
  findOne(@Param("id") id: string): Promise<Employee | null> {
    return this.employees.findOne(id);
  }
}
