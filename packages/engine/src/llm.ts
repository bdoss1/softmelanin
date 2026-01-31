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

  async generate(prompt: string, _options?: LLMOptions): Promise<string> {
    // Detect platform from prompt
    const isSubstack = prompt.toLowerCase().includes("substack");
    const isCompany = prompt.toLowerCase().includes("linkedin_company") || prompt.toLowerCase().includes("company post");

    if (isSubstack) {
      return this.generateSubstackContent();
    } else if (isCompany) {
      return this.generateCompanyContent();
    }
    return this.generateFounderContent();
  }

  private generateFounderContent(): string {
    // ~200 words to meet 150-300 requirement
    return JSON.stringify({
      hook: "The myth of 'just pushing through' cost me my health, my joy, and nearly my career.",
      body: `I spent 15 years believing that rest was a reward I hadn't earned yet.

Every boundary I set felt like betrayal. Every pause felt like failure.

Until my body made the choice for me.

Here's what I learned in recovery:

Your worth was never tied to your output. The people who truly see you don't need you depleted to feel valued.

Softness isn't the absence of strength—it's the presence of wisdom.

Today, I lead differently. Not from exhaustion, but from intention. Not from proving, but from being.

The transformation wasn't about doing less. It was about being more intentional with what I chose to carry.

Now I ask myself daily: Does this align with my values? Does this honor my capacity? Does this serve my vision?

If this resonates, I want you to know: you can put down the weight without losing your way.

You can be excellent and boundaried. You can be dependable and protected. You can lead and still breathe.`,
      tripleS: {
        stop: {
          hook: "The myth of 'just pushing through' cost me my health, my joy, and nearly my career.",
          fiveC: "conflict"
        },
        stay: {
          story: "Personal narrative of burnout and recovery, illustrating the cost of ignoring boundaries and the transformation that comes from embracing softness as a leadership practice."
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
        own: "Taking ownership of boundaries and the choice to lead from intention rather than exhaustion",
        filter: "Learning to filter demands through the lens of sustainability and alignment",
        thrive: "Building systems that support flourishing without requiring constant depletion"
      },
      hashtags: ["#SoftMelanin", "#SoftnessIsPower", "#BoundariesAreSoftness", "#BlackWomenLead", "#SoftLifeCoaching"],
      visual: {
        prompt: "A Black woman in a peaceful moment of reflection, sitting by a window with warm morning light, wearing soft earth tones. Gentle smile and relaxed posture, embodying peace and self-assurance. Style: warm photography with golden brown palette, soft focus, intimate atmosphere.",
        palette: ["#6e3f2b", "#a6683f", "#d2955e"],
        quoteCardTextOptions: ["Softness isn't weakness. It's wisdom.", "Rest before you break.", "Your worth is not your output."]
      },
      growth: {
        bestPostingTimes: ["Tuesday 9:00 AM EST", "Wednesday 12:00 PM EST", "Thursday 7:00 AM EST"],
        repurposingIdeas: ["Extract takeaways as quote graphics", "Expand into a Substack article", "Create a transformation carousel"],
        abVariants: [
          { label: "A", hook: "The myth of 'just pushing through' cost me my health, my joy, and nearly my career." },
          { label: "B", hook: "I used to believe rest was a reward. My body taught me it's a requirement." }
        ]
      },
      qa: { authenticityPass: true, brandVoicePass: true, culturalSensitivityPass: true, businessRelevancePass: true, errors: [] }
    });
  }

  private generateCompanyContent(): string {
    return JSON.stringify({
      hook: "The S.O.F.T. Framework isn't about doing less. It's about building different.",
      body: `At Soft Melanin, we believe boundaries are the foundation of sustainable leadership. Not barriers. Foundation.

Our S.O.F.T. Framework helps professionals reclaim their energy and lead with intention.

S - Separate your worth from your work output. Your value exists beyond your productivity.

O - Own your role and its actual boundaries. Know where your responsibility truly ends.

F - Filter demands through sustainability, not just capability. Just because you can doesn't mean you should.

T - Thrive through systems that support rather than strain. Build structures that protect your peace.

This isn't about stepping back from leadership. It's about stepping into leadership that doesn't require your depletion.

Because you can be excellent and boundaried. You can be dependable and protected. You can lead and still breathe.

The question isn't whether you can maintain the pace. It's whether the pace deserves you.

We help high-achieving women build sustainable success without sacrificing their wellbeing.`,
      tripleS: {
        stop: { hook: "The S.O.F.T. Framework isn't about doing less. It's about building different.", fiveC: "contradiction" },
        stay: { story: "Educational content reframing SOFT methodology as a tool for leadership excellence rather than stepping back." },
        share: {
          takeaways: ["Separate worth from work output", "Filter demands through sustainability", "You can be excellent and boundaried"],
          cta: "Which element of the S.O.F.T. framework resonates most with where you are right now?"
        }
      },
      soft: {
        separate: "The core teaching of disconnecting identity from productivity metrics",
        own: "Taking clear ownership of role boundaries and what is truly yours to carry",
        filter: "Evaluating demands through sustainability rather than just capability",
        thrive: "Building systems and structures that support long-term flourishing"
      },
      hashtags: ["#SoftMelanin", "#SoftnessStrategist", "#BoundariesAreSoftness", "#BlackWomenLead", "#SoftBusinessStrategy"],
      visual: {
        prompt: "Elegant infographic showing SOFT framework as four interconnected elements using warm earth tones. Clean professional design suggesting empowered leadership. Style: modern business graphic, warm browns and golds, sophisticated.",
        palette: ["#6e3f2b", "#a6683f", "#d2955e"],
        quoteCardTextOptions: ["Excellent and boundaried.", "Dependable and protected.", "Lead and still breathe."]
      },
      growth: {
        bestPostingTimes: ["Monday 9:00 AM EST", "Wednesday 11:00 AM EST", "Thursday 8:00 AM EST"],
        repurposingIdeas: ["Create animated carousel for each SOFT element", "Develop a SOFT assessment quiz", "Turn into Substack series"],
        abVariants: [
          { label: "A", hook: "The S.O.F.T. Framework isn't about doing less. It's about building different." },
          { label: "B", hook: "What if sustainable leadership started with how you treat yourself?" }
        ]
      },
      qa: { authenticityPass: true, brandVoicePass: true, culturalSensitivityPass: true, businessRelevancePass: true, errors: [] }
    });
  }

  private generateSubstackContent(): string {
    return JSON.stringify({
      hook: "The Dependable One's Dilemma: When Your Competence Becomes Your Cage",
      body: `## Introduction

You've built a reputation. People count on you. When things need to get done—really get done—your name is the first one mentioned. This should feel like success. Instead, it feels like a trap you built with your own excellence.

Welcome to the dependable one's dilemma: the more capable you prove yourself, the more you're expected to carry. The better you perform under pressure, the more pressure gets directed your way.

## The Hidden Cost of Being Indispensable

Let's be honest about what's happening beneath the surface of your reputation. Every time you say yes when you mean no, you're training others that your boundaries are negotiable. You're reinforcing systems that depend on individual sacrifice. You're depleting the very excellence that made you valuable in the first place.

This isn't about capability. You can do it. The question is: should you?

## Reframing Dependability Through the S.O.F.T. Framework

### S - Separate Worth from Work

The first step is recognizing that your value as a person is not determined by your availability as a resource. You are not your to-do list. You are not your response time. You are not the problems you solve. These are things you do. They are not who you are.

### O - Own Your Role and Its Actual Boundaries

What is your job, actually? Not what it has expanded to become. Not what others expect. Most overextended professionals are doing two or three jobs while being paid and titled for one. Owning your actual role means getting clear about where your responsibility ends.

### F - Filter Demands Through Sustainability

Every request that comes to you needs to pass through a filter: Can I do this sustainably? Not "Can I do this?" Of course you can. But: "Can I do this without depleting my capacity for what actually matters?"

### T - Thrive Through Sustainable Systems

The goal isn't to do less. It's to build systems that support you doing what matters without constantly operating at the edge of your capacity.

## The Cultural Context

For Black women in professional spaces, this conversation carries additional weight. We've been taught that excellence is our protection—that being indispensable is how we secure our place at tables that weren't built for us. And there's truth in that history.

But there's also a cost that rarely gets named: the expectation that we will carry more, complain less, and somehow remain grateful for the opportunity to be overworked.

Setting boundaries in this context isn't just personal wellness. It's a form of resistance. It's refusing to participate in systems that extract our labor while undervaluing our humanity.

## Taking Action This Week

First, audit your current commitments. What are you doing that isn't actually your job? Second, identify one recurring request you can redirect. Not reject—redirect. Third, practice one boundary phrase. Say it out loud. Let it feel uncomfortable. Then use it.

## Closing Reflection

You've spent years proving you can handle anything. Maybe it's time to prove you can protect something—yourself. Not because you can't keep going. But because you deserve a career and a life that doesn't require your depletion to function.

You can be dependable and boundaried. You can be excellent and protected. The dependable one's dilemma has a solution. It starts with you deciding that your sustainability matters as much as your capability.`,
      tripleS: {
        stop: { hook: "The Dependable One's Dilemma: When Your Competence Becomes Your Cage", fiveC: "conflict" },
        stay: { story: "Deep exploration of how professional excellence can become a trap, with cultural context specific to Black women's experiences and practical frameworks for sustainable change." },
        share: {
          takeaways: ["Your value is not determined by your availability", "Setting boundaries is a form of resistance", "You can be dependable and boundaried"],
          cta: "What's one boundary you've been avoiding that could change your relationship with work?"
        }
      },
      soft: {
        separate: "Detailed exploration of separating identity from productivity and external validation",
        own: "Frameworks for understanding actual role boundaries versus expanded expectations",
        filter: "Practical tools for filtering requests through sustainability rather than capability",
        thrive: "Systems-building approach to sustainable excellence and long-term flourishing"
      },
      hashtags: ["#SoftMelanin", "#SoftnessIsPower", "#BoundariesAreSoftness", "#BlackWomenLead", "#SoftLifeCoaching"],
      seoTags: ["workplace boundaries", "Black women leadership", "burnout prevention", "professional development", "work-life balance", "emotional labor", "career sustainability"],
      visual: {
        prompt: "Black woman professional in empowered reflection, transitioning from overwhelm to clarity. Split composition: cluttered desk to peaceful organized workspace. Style: editorial photography, warm earth tones, empowering mood.",
        palette: ["#6e3f2b", "#a6683f", "#d2955e"],
        quoteCardTextOptions: ["Your competence is not a cage.", "Excellence and boundaries can coexist.", "Sustainability matters."]
      },
      growth: {
        bestPostingTimes: ["Sunday 10:00 AM EST", "Tuesday 7:00 AM EST"],
        repurposingIdeas: ["Extract 5-7 LinkedIn posts", "Create Boundary Scripts PDF", "Develop email series", "Record as podcast"],
        abVariants: [
          { label: "A", hook: "The Dependable One's Dilemma: When Your Competence Becomes Your Cage" },
          { label: "B", hook: "What if the excellence that built your career is now holding you hostage?" }
        ]
      },
      qa: { authenticityPass: true, brandVoicePass: true, culturalSensitivityPass: true, businessRelevancePass: true, errors: [] }
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
