// ============================================================================
// LLM Provider Abstraction
// ============================================================================

export interface LLMProvider {
  name: string;
  generate(prompt: string, options?: LLMOptions): Promise<string>;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface LLMConfig {
  provider: "openai" | "anthropic" | "mock";
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

// ============================================================================
// OpenAI Provider
// ============================================================================

export class OpenAIProvider implements LLMProvider {
  name = "openai";
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: { apiKey: string; model?: string; baseUrl?: string }) {
    this.apiKey = config.apiKey;
    this.model = config.model || "gpt-4-turbo-preview";
    this.baseUrl = config.baseUrl || "https://api.openai.com/v1";
  }

  async generate(prompt: string, options?: LLMOptions): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: options?.model || this.model,
        messages: [
          {
            role: "system",
            content: "You are a content strategist for Soft Melanin, a brand empowering Black women through softness. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}

// ============================================================================
// Anthropic Provider
// ============================================================================

export class AnthropicProvider implements LLMProvider {
  name = "anthropic";
  private apiKey: string;
  private model: string;

  constructor(config: { apiKey: string; model?: string }) {
    this.apiKey = config.apiKey;
    this.model = config.model || "claude-3-sonnet-20240229";
  }

  async generate(prompt: string, options?: LLMOptions): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: options?.model || this.model,
        max_tokens: options?.maxTokens ?? 4000,
        messages: [
          {
            role: "user",
            content: `${prompt}\n\nRespond ONLY with valid JSON. No additional text.`
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }
}

// ============================================================================
// Mock Provider (for development/testing)
// ============================================================================

export class MockProvider implements LLMProvider {
  name = "mock";

  async generate(_prompt: string, _options?: LLMOptions): Promise<string> {
    // Return a mock content artifact
    return JSON.stringify({
      platform: "linkedin_founder",
      segment: "overextended_professional",
      hook: "The myth of 'just pushing through' cost me my health, my joy, and nearly my career.",
      body: `I spent 15 years believing that rest was a reward I hadn't earned yet.

Every boundary I set felt like betrayal.

Every pause felt like failure.

Until my body made the choice for me.

Here's what I learned in recovery:

Your worth was never tied to your output.

The people who truly see you don't need you depleted to feel valued.

Softness isn't the absence of strength—it's the presence of wisdom.

Today, I lead differently.

Not from exhaustion, but from intention.

Not from proving, but from being.

If this resonates, I want you to know: you can put down the weight without losing your way.`,
      tripleS: {
        stop: {
          hook: "The myth of 'just pushing through' cost me my health, my joy, and nearly my career.",
          fiveC: "conflict"
        },
        stay: {
          story: "Personal narrative of burnout and recovery, illustrating the cost of ignoring boundaries and the transformation that comes from embracing softness."
        },
        share: {
          takeaways: [
            "Your worth was never tied to your output",
            "Softness isn't the absence of strength—it's the presence of wisdom",
            "You can put down the weight without losing your way"
          ],
          cta: "What would change if you gave yourself permission to rest before you break?"
        }
      },
      soft: {
        separate: "Disconnecting self-worth from productivity metrics and external validation",
        own: "Taking ownership of boundaries and the choice to lead from intention",
        filter: "Learning to filter demands through the lens of sustainability",
        thrive: "Building systems that support flourishing without depletion"
      },
      hashtags: [
        "#SoftMelanin",
        "#SoftnessIsPower",
        "#BoundariesAreSoftness",
        "#BlackWomenLead",
        "#SoftLifeCoaching"
      ],
      visual: {
        prompt: "A Black woman in a peaceful moment of reflection, sitting by a window with warm morning light, wearing soft earth tones. She has a gentle smile and relaxed posture, embodying peace and self-assurance. Artistic style: warm photography with golden brown and deep brown color palette, soft focus, intimate atmosphere.",
        palette: ["#6e3f2b", "#a6683f", "#d2955e"],
        quoteCardTextOptions: [
          "Softness isn't weakness. It's wisdom.",
          "Rest before you break.",
          "Your worth ≠ your output"
        ]
      },
      growth: {
        bestPostingTimes: [
          "Tuesday 9:00 AM EST",
          "Wednesday 12:00 PM EST",
          "Thursday 7:00 AM EST"
        ],
        repurposingIdeas: [
          "Extract the 3 takeaways as individual quote graphics",
          "Expand the recovery story into a Substack article",
          "Create a carousel showing the 'before/after' transformation"
        ],
        abVariants: [
          {
            label: "A",
            hook: "The myth of 'just pushing through' cost me my health, my joy, and nearly my career."
          },
          {
            label: "B",
            hook: "I used to believe rest was a reward. My body taught me it's a requirement."
          }
        ]
      },
      qa: {
        authenticityPass: true,
        brandVoicePass: true,
        culturalSensitivityPass: true,
        businessRelevancePass: true,
        errors: []
      }
    });
  }
}

// ============================================================================
// Provider Factory
// ============================================================================

export function createLLMProvider(config: LLMConfig): LLMProvider {
  switch (config.provider) {
    case "openai":
      if (!config.apiKey) {
        throw new Error("OpenAI API key required");
      }
      return new OpenAIProvider({
        apiKey: config.apiKey,
        model: config.model,
        baseUrl: config.baseUrl
      });

    case "anthropic":
      if (!config.apiKey) {
        throw new Error("Anthropic API key required");
      }
      return new AnthropicProvider({
        apiKey: config.apiKey,
        model: config.model
      });

    case "mock":
      return new MockProvider();

    default:
      throw new Error(`Unknown LLM provider: ${config.provider}`);
  }
}
