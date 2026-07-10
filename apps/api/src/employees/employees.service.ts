import { Injectable } from "@nestjs/common";
import { FirebaseService } from "../firebase/firebase.service";
import type { Employee } from "@av-crm/shared-types";

@Injectable()
export class EmployeesService {
  constructor(private readonly firebase: FirebaseService) {}

  private col() {
    return this.firebase.firestore.collection("employees");
  }

  async findAll(filter: {
    companyId?: string;
    subsidiaryId?: string;
    departmentId?: string;
  }): Promise<Employee[]> {
    let query: FirebaseFirestore.Query = this.col();
    if (filter.companyId) query = query.where("companyId", "==", filter.companyId);
    if (filter.subsidiaryId)
      query = query.where("subsidiaryId", "==", filter.subsidiaryId);
    if (filter.departmentId)
      query = query.where("departmentId", "==", filter.departmentId);
    const snap = await query.get();
    return snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as Omit<Employee, "id">) }),
    );
  }

  async findOne(id: string): Promise<Employee | null> {
    const doc = await this.col().doc(id).get();
    return doc.exists
      ? { id: doc.id, ...(doc.data() as Omit<Employee, "id">) }
      : null;
  }
}
