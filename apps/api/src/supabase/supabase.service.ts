import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the SERVICE_ROLE key.
 * Bypasses RLS - use only from trusted backend code.
 *
 * Use for: admin tasks, file uploads, cross-user queries.
 * Do NOT expose this client to the browser.
 */
@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private _admin: SupabaseClient | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>("SUPABASE_URL");
    const serviceKey = this.config.get<string>("SUPABASE_SERVICE_KEY");

    if (!url || !serviceKey) {
      this.logger.warn(
        "SUPABASE_URL or SUPABASE_SERVICE_KEY missing - Supabase features will fail",
      );
      return;
    }

    this._admin = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    this.logger.log("Supabase admin client initialized");
  }

  get admin(): SupabaseClient {
    if (!this._admin) {
      throw new Error("Supabase admin client not initialized");
    }
    return this._admin;
  }

  /**
   * Upload a file to a public bucket.
   * Path is relative to the bucket root.
   */
  async uploadPublic(
    bucket: "avatars" | "assets",
    path: string,
    file: Buffer | Uint8Array,
    contentType: string,
  ) {
    const { data, error } = await this.admin.storage
      .from(bucket)
      .upload(path, file, { contentType, upsert: true });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = this.admin.storage.from(bucket).getPublicUrl(data.path);

    return { path: data.path, publicUrl };
  }
}
