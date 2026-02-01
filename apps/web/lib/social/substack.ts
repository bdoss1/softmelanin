// ============================================================================
// Substack API Integration Service
// ============================================================================

import {
  SUBSTACK_API_CONFIG,
  SubstackPublication,
  PostResult,
  ContentArtifact,
} from "@soft-melanin/shared";

interface SubstackApiConfig {
  email: string;
  apiKey: string; // Substack API key from settings
  subdomain: string;
}

interface SubstackDraft {
  id: string;
  title: string;
  subtitle?: string;
  body_html: string;
  draft_created_at: string;
  type: "newsletter" | "podcast" | "thread";
}

interface SubstackPost {
  id: number;
  title: string;
  subtitle?: string;
  slug: string;
  canonical_url: string;
  post_date: string;
  audience: "everyone" | "only_paid" | "founding";
  write_comment_permissions: "everyone" | "only_paid" | "none";
}

interface CreatePostOptions {
  title: string;
  subtitle?: string;
  bodyHtml: string;
  audience?: "everyone" | "only_paid" | "founding";
  sendEmail?: boolean;
  publishNow?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
}

export class SubstackService {
  private config: SubstackApiConfig;

  constructor(config?: Partial<SubstackApiConfig>) {
    this.config = {
      email: config?.email || process.env.SUBSTACK_EMAIL || "",
      apiKey: config?.apiKey || process.env.SUBSTACK_API_KEY || "",
      subdomain: config?.subdomain || process.env.SUBSTACK_SUBDOMAIN || "",
    };
  }

  setCredentials(email: string, apiKey: string, subdomain: string): void {
    this.config.email = email;
    this.config.apiKey = apiKey;
    this.config.subdomain = subdomain;
  }

  // ============================================================================
  // Authentication
  // ============================================================================

  private getAuthHeaders(): Record<string, string> {
    // Substack uses email:api_key for basic auth
    const credentials = Buffer.from(
      `${this.config.email}:${this.config.apiKey}`
    ).toString("base64");

    return {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    };
  }

  private getBaseUrl(): string {
    return `https://${this.config.subdomain}.substack.com/api/v1`;
  }

  // ============================================================================
  // Publication APIs
  // ============================================================================

  async getPublication(): Promise<SubstackPublication | null> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/publication`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        id: String(data.id),
        name: data.name,
        subdomain: data.subdomain,
        customDomain: data.custom_domain,
        logoUrl: data.logo_url,
      };
    } catch {
      return null;
    }
  }

  async validateCredentials(): Promise<boolean> {
    const publication = await this.getPublication();
    return publication !== null;
  }

  // ============================================================================
  // Draft Management
  // ============================================================================

  async createDraft(options: CreatePostOptions): Promise<SubstackDraft | null> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/drafts`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          title: options.title,
          subtitle: options.subtitle,
          body_html: options.bodyHtml,
          type: "newsletter",
          audience: options.audience || "everyone",
          write_comment_permissions: "everyone",
          ...(options.seoTitle && { seo_title: options.seoTitle }),
          ...(options.seoDescription && { seo_description: options.seoDescription }),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Substack draft creation error:", error);
        return null;
      }

      return response.json();
    } catch (error) {
      console.error("Substack draft creation error:", error);
      return null;
    }
  }

  async getDrafts(): Promise<SubstackDraft[]> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/drafts`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        return [];
      }

      return response.json();
    } catch {
      return [];
    }
  }

  async deleteDraft(draftId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/drafts/${draftId}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // Publishing APIs
  // ============================================================================

  async publishDraft(
    draftId: string,
    sendEmail: boolean = true
  ): Promise<SubstackPost | null> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/drafts/${draftId}/publish`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            send: sendEmail,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("Substack publish error:", error);
        return null;
      }

      return response.json();
    } catch (error) {
      console.error("Substack publish error:", error);
      return null;
    }
  }

  async createAndPublish(
    options: CreatePostOptions
  ): Promise<SubstackPost | null> {
    // First create the draft
    const draft = await this.createDraft(options);
    if (!draft) {
      return null;
    }

    // If not publishing immediately, return draft info as a "post"
    if (!options.publishNow) {
      return {
        id: parseInt(draft.id),
        title: draft.title,
        subtitle: draft.subtitle,
        slug: "",
        canonical_url: "",
        post_date: draft.draft_created_at,
        audience: options.audience || "everyone",
        write_comment_permissions: "everyone",
      };
    }

    // Publish the draft
    return this.publishDraft(draft.id, options.sendEmail ?? true);
  }

  // ============================================================================
  // Post from Artifact
  // ============================================================================

  async postFromArtifact(
    artifact: ContentArtifact,
    options?: { publishNow?: boolean; sendEmail?: boolean }
  ): Promise<PostResult> {
    try {
      // Convert artifact body to HTML
      const bodyHtml = this.artifactToHtml(artifact);

      // Extract SEO info
      const seoTags = artifact.seoTags || [];
      const seoDescription = seoTags.length > 0
        ? seoTags.slice(0, 3).join(", ")
        : undefined;

      const post = await this.createAndPublish({
        title: artifact.hook,
        subtitle: this.extractSubtitle(artifact),
        bodyHtml,
        publishNow: options?.publishNow ?? false,
        sendEmail: options?.sendEmail ?? true,
        seoTitle: artifact.hook,
        seoDescription,
        tags: seoTags,
      });

      if (!post) {
        return {
          success: false,
          platform: "substack",
          error: "Failed to create Substack post",
        };
      }

      return {
        success: true,
        platform: "substack",
        externalPostId: String(post.id),
        externalUrl: post.canonical_url || this.getPostUrl(post.slug),
        rawResponse: post,
      };
    } catch (error) {
      return {
        success: false,
        platform: "substack",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private artifactToHtml(artifact: ContentArtifact): string {
    // Split body into paragraphs and wrap in HTML
    const paragraphs = artifact.body
      .split(/\n\n+/)
      .map((p) => `<p>${this.escapeHtml(p.trim())}</p>`)
      .join("\n");

    // Build the full HTML content
    let html = paragraphs;

    // Add SOFT framework section if available
    if (artifact.soft) {
      html += `
<h2>The S.O.F.T. Framework in Action</h2>
<ul>
  <li><strong>Separate:</strong> ${this.escapeHtml(artifact.soft.separate)}</li>
  <li><strong>Own:</strong> ${this.escapeHtml(artifact.soft.own)}</li>
  <li><strong>Filter:</strong> ${this.escapeHtml(artifact.soft.filter)}</li>
  <li><strong>Thrive:</strong> ${this.escapeHtml(artifact.soft.thrive)}</li>
</ul>`;
    }

    // Add CTA if available from tripleS
    if (artifact.tripleS?.share?.cta) {
      html += `
<hr>
<p><em>${this.escapeHtml(artifact.tripleS.share.cta)}</em></p>`;
    }

    // Add hashtags as tags section
    if (artifact.hashtags && artifact.hashtags.length > 0) {
      html += `
<p><small>Tags: ${artifact.hashtags.map(t => this.escapeHtml(t)).join(", ")}</small></p>`;
    }

    return html;
  }

  private extractSubtitle(artifact: ContentArtifact): string | undefined {
    // Try to extract a subtitle from the first paragraph or tripleS stay
    if (artifact.tripleS?.stay?.story) {
      const story = artifact.tripleS.stay.story;
      // Get first sentence as subtitle
      const firstSentence = story.split(/[.!?]/)[0];
      if (firstSentence && firstSentence.length <= 200) {
        return firstSentence.trim();
      }
    }

    // Fallback to first 200 chars of body
    const firstPara = artifact.body.split(/\n\n/)[0];
    if (firstPara && firstPara.length <= 200) {
      return firstPara.trim();
    }

    return undefined;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private getPostUrl(slug: string): string {
    if (this.config.subdomain) {
      return `https://${this.config.subdomain}.substack.com/p/${slug}`;
    }
    return "";
  }

  // ============================================================================
  // Subscriber Stats
  // ============================================================================

  async getSubscriberStats(): Promise<{
    total: number;
    free: number;
    paid: number;
  } | null> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/subscriber_stats`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        total: data.total_subscribers || 0,
        free: data.free_subscribers || 0,
        paid: data.paid_subscribers || 0,
      };
    } catch {
      return null;
    }
  }

  // ============================================================================
  // Post Analytics
  // ============================================================================

  async getPostStats(postId: string): Promise<{
    views: number;
    reads: number;
    likes: number;
    comments: number;
    shares: number;
  } | null> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/posts/${postId}/stats`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        views: data.post_audience_stats?.total_views || 0,
        reads: data.post_audience_stats?.total_reads || 0,
        likes: data.reactions_count || 0,
        comments: data.comments_count || 0,
        shares: data.shares_count || 0,
      };
    } catch {
      return null;
    }
  }
}

// Singleton instance for convenience
let substackServiceInstance: SubstackService | null = null;

export function getSubstackService(): SubstackService {
  if (!substackServiceInstance) {
    substackServiceInstance = new SubstackService();
  }
  return substackServiceInstance;
}
