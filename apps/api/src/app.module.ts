import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { SupabaseController } from './supabase.controller';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { SubsidiariesModule } from './subsidiaries/subsidiaries.module';
import { DepartmentsModule } from './departments/departments.module';
import { EmployeesModule } from './employees/employees.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SupabaseModule,
    FirebaseModule,
    AuthModule,
    CompaniesModule,
    SubsidiariesModule,
    DepartmentsModule,
    EmployeesModule,
  ],
  controllers: [AppController, SupabaseController],
  providers: [AppService],
})
export class AppModule {}
