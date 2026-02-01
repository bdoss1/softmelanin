// ============================================================================
// LinkedIn API Integration Service
// ============================================================================

import {
  LINKEDIN_API_CONFIG,
  LinkedInProfile,
  LinkedInOrganization,
  PostResult,
  OAuthTokenResponse,
  ContentArtifact,
} from "@soft-melanin/shared";

interface LinkedInApiConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface LinkedInShareContent {
  author: string;
  lifecycleState: "PUBLISHED";
  specificContent: {
    "com.linkedin.ugc.ShareContent": {
      shareCommentary: {
        text: string;
      };
      shareMediaCategory: "NONE" | "ARTICLE" | "IMAGE";
    };
  };
  visibility: {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" | "CONNECTIONS";
  };
}

export class LinkedInService {
  private config: LinkedInApiConfig;
  private accessToken: string | null = null;

  constructor(config?: Partial<LinkedInApiConfig>) {
    this.config = {
      clientId: config?.clientId || process.env.LINKEDIN_CLIENT_ID || "",
      clientSecret: config?.clientSecret || process.env.LINKEDIN_CLIENT_SECRET || "",
      redirectUri: config?.redirectUri || process.env.LINKEDIN_REDIRECT_URI || "",
    };
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  // ============================================================================
  // OAuth Flow
  // ============================================================================

  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: LINKEDIN_API_CONFIG.scopes.join(" "),
      ...(state && { state }),
    });

    return `${LINKEDIN_API_CONFIG.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    const response = await fetch(LINKEDIN_API_CONFIG.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LinkedIn OAuth error: ${error}`);
    }

    return response.json();
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    const response = await fetch(LINKEDIN_API_CONFIG.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LinkedIn token refresh error: ${error}`);
    }

    return response.json();
  }

  // ============================================================================
  // Profile & Organization APIs
  // ============================================================================

  async getProfile(): Promise<LinkedInProfile> {
    if (!this.accessToken) {
      throw new Error("Access token not set");
    }

    const response = await fetch(`${LINKEDIN_API_CONFIG.apiBaseUrl}/userinfo`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LinkedIn API error: ${error}`);
    }

    const data = await response.json();
    return {
      id: data.sub,
      localizedFirstName: data.given_name || "",
      localizedLastName: data.family_name || "",
      profilePicture: data.picture,
    };
  }

  async getOrganizations(): Promise<LinkedInOrganization[]> {
    if (!this.accessToken) {
      throw new Error("Access token not set");
    }

    // Get organizations the user administers
    const response = await fetch(
      `${LINKEDIN_API_CONFIG.apiBaseUrl}/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName,vanityName,logoV2(original~:playableStreams))))`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    if (!response.ok) {
      // User may not have organization admin access
      if (response.status === 403) {
        return [];
      }
      const error = await response.text();
      throw new Error(`LinkedIn API error: ${error}`);
    }

    const data = await response.json();
    return (data.elements || []).map((element: Record<string, unknown>) => {
      const org = element["organization~"] as Record<string, unknown> || {};
      return {
        id: String(org.id || ""),
        localizedName: String(org.localizedName || ""),
        vanityName: org.vanityName ? String(org.vanityName) : undefined,
      };
    });
  }

  // ============================================================================
  // Posting APIs
  // ============================================================================

  async createPost(
    artifact: ContentArtifact,
    authorType: "person" | "organization",
    authorId: string
  ): Promise<PostResult> {
    if (!this.accessToken) {
      throw new Error("Access token not set");
    }

    try {
      // Build the post content from the artifact
      const postText = this.buildPostText(artifact);

      const shareContent: LinkedInShareContent = {
        author: `urn:li:${authorType}:${authorId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: postText,
            },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      };

      const response = await fetch(`${LINKEDIN_API_CONFIG.apiBaseUrl}/ugcPosts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(shareContent),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          platform: "linkedin",
          error: `LinkedIn posting error: ${error}`,
        };
      }

      const data = await response.json();
      const postId = data.id;

      return {
        success: true,
        platform: "linkedin",
        externalPostId: postId,
        externalUrl: this.getPostUrl(postId, authorType, authorId),
        rawResponse: data,
      };
    } catch (error) {
      return {
        success: false,
        platform: "linkedin",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private buildPostText(artifact: ContentArtifact): string {
    // Combine hook and body
    let text = `${artifact.hook}\n\n${artifact.body}`;

    // Add hashtags
    if (artifact.hashtags && artifact.hashtags.length > 0) {
      text += "\n\n" + artifact.hashtags.join(" ");
    }

    // LinkedIn has a 3000 character limit
    if (text.length > 3000) {
      text = text.substring(0, 2997) + "...";
    }

    return text;
  }

  private getPostUrl(
    postId: string,
    authorType: string,
    authorId: string
  ): string {
    // Extract the activity ID from the URN
    const activityMatch = postId.match(/urn:li:share:(\d+)/);
    if (activityMatch) {
      return `https://www.linkedin.com/feed/update/urn:li:share:${activityMatch[1]}/`;
    }
    return `https://www.linkedin.com/feed/`;
  }

  // ============================================================================
  // Post Management APIs
  // ============================================================================

  async deletePost(postUrn: string): Promise<boolean> {
    if (!this.accessToken) {
      throw new Error("Access token not set");
    }

    const encodedUrn = encodeURIComponent(postUrn);
    const response = await fetch(
      `${LINKEDIN_API_CONFIG.apiBaseUrl}/ugcPosts/${encodedUrn}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    return response.ok;
  }

  async getPostAnalytics(postUrn: string): Promise<Record<string, number> | null> {
    if (!this.accessToken) {
      throw new Error("Access token not set");
    }

    try {
      const encodedUrn = encodeURIComponent(postUrn);
      const response = await fetch(
        `${LINKEDIN_API_CONFIG.apiBaseUrl}/socialActions/${encodedUrn}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        likes: data.likesSummary?.totalLikes || 0,
        comments: data.commentsSummary?.totalFirstLevelComments || 0,
      };
    } catch {
      return null;
    }
  }
}

// Singleton instance for convenience
let linkedInServiceInstance: LinkedInService | null = null;

export function getLinkedInService(): LinkedInService {
  if (!linkedInServiceInstance) {
    linkedInServiceInstance = new LinkedInService();
  }
  return linkedInServiceInstance;
}
