"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { ContentArtifact, Segment, Platform, SEGMENT_PROFILES, PLATFORM_CONFIGS } from "@soft-melanin/shared";
import { Check, Copy, Download, AlertCircle, CheckCircle, Sparkles } from "lucide-react";

// Segment selection options
const SEGMENTS: { value: Segment; label: string }[] = [
  { value: "overextended_professional", label: "Overextended Professional" },
  { value: "healing_high_achiever", label: "Healing High-Achiever" },
  { value: "creative_reclaimer", label: "Creative Reclaimer" },
];

// Platform selection options
const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "linkedin_founder", label: "LinkedIn Founder" },
  { value: "linkedin_company", label: "LinkedIn Company" },
  { value: "substack", label: "Substack" },
];

export default function Home() {
  const [seedIdea, setSeedIdea] = useState("");
  const [monthlyTheme, setMonthlyTheme] = useState("");
  const [selectedSegments, setSelectedSegments] = useState<Segment[]>(["overextended_professional"]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["linkedin_founder"]);
  const [includeProducts, setIncludeProducts] = useState(false);
  const [generateVariants, setGenerateVariants] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [artifacts, setArtifacts] = useState<ContentArtifact[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<ContentArtifact | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleSegment = (segment: Segment) => {
    setSelectedSegments((prev) =>
      prev.includes(segment)
        ? prev.filter((s) => s !== segment)
        : [...prev, segment]
    );
  };

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleGenerate = async () => {
    if (!seedIdea.trim() || selectedSegments.length === 0 || selectedPlatforms.length === 0) {
      setErrors(["Please provide a seed idea and select at least one segment and platform."]);
      return;
    }

    setIsGenerating(true);
    setErrors([]);
    setArtifacts([]);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seedIdea,
          monthlyTheme: monthlyTheme || undefined,
          segments: selectedSegments,
          platforms: selectedPlatforms,
          includeProductMentions: includeProducts,
          generateABVariants: generateVariants,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setArtifacts(data.artifacts);
        if (data.errors && data.errors.length > 0) {
          setErrors(data.errors);
        }
      } else {
        setErrors(data.errors || ["Generation failed. Please try again."]);
      }
    } catch (error) {
      setErrors(["Network error. Please check your connection and try again."]);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportJSON = (artifact: ContentArtifact) => {
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soft-melanin-${artifact.platform}-${artifact.segment}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Generation Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-primary" />
                Content Generator
              </CardTitle>
              <CardDescription>
                Create brand-aligned content for LinkedIn and Substack
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seed Idea Input */}
              <div className="space-y-2">
                <Label htmlFor="seed">Seed Idea *</Label>
                <Textarea
                  id="seed"
                  placeholder="e.g., Boundaries at work when everyone thinks you're the dependable one"
                  value={seedIdea}
                  onChange={(e) => setSeedIdea(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              {/* Monthly Theme Input */}
              <div className="space-y-2">
                <Label htmlFor="theme">Monthly Theme (Optional)</Label>
                <Textarea
                  id="theme"
                  placeholder="e.g., Reclaiming Rest in Q1"
                  value={monthlyTheme}
                  onChange={(e) => setMonthlyTheme(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>

              {/* Segment Selection */}
              <div className="space-y-2">
                <Label>Target Segments *</Label>
                <div className="flex flex-wrap gap-2">
                  {SEGMENTS.map((segment) => (
                    <button
                      key={segment.value}
                      onClick={() => toggleSegment(segment.value)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedSegments.includes(segment.value)
                          ? "bg-brand-primary text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {segment.label}
                    </button>
                  ))}
                </div>
                {selectedSegments.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {SEGMENT_PROFILES[selectedSegments[0]].description}
                  </p>
                )}
              </div>

              {/* Platform Selection */}
              <div className="space-y-2">
                <Label>Platforms *</Label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((platform) => (
                    <button
                      key={platform.value}
                      onClick={() => togglePlatform(platform.value)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedPlatforms.includes(platform.value)
                          ? "bg-brand-secondary text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {platform.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeProducts}
                    onChange={(e) => setIncludeProducts(e.target.checked)}
                    className="rounded border-input"
                  />
                  <span className="text-sm">Include product mentions</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateVariants}
                    onChange={(e) => setGenerateVariants(e.target.checked)}
                    className="rounded border-input"
                  />
                  <span className="text-sm">Generate A/B variants</span>
                </label>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !seedIdea.trim()}
                className="w-full"
                variant="brand"
              >
                {isGenerating ? (
                  <>
                    <Spinner size="sm" className="mr-2 text-white" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>

              {/* Errors */}
              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Generation Issues</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      {errors.map((error, i) => (
                        <li key={i} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Generated Content */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generated Content</CardTitle>
              <CardDescription>
                {artifacts.length > 0
                  ? `${artifacts.length} artifact${artifacts.length > 1 ? "s" : ""} generated`
                  : "Your content will appear here"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {artifacts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter a seed idea and generate content</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {artifacts.map((artifact, index) => (
                    <ArtifactCard
                      key={index}
                      artifact={artifact}
                      onCopy={(text) => copyToClipboard(text, `${index}`)}
                      onExport={() => exportJSON(artifact)}
                      onView={() => setSelectedArtifact(artifact)}
                      isCopied={copiedId === `${index}`}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Artifact Detail Dialog */}
      <Dialog open={!!selectedArtifact} onOpenChange={() => setSelectedArtifact(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedArtifact && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>{PLATFORM_CONFIGS[selectedArtifact.platform].name}</span>
                  <Badge variant={selectedArtifact.qa.errors.length === 0 ? "success" : "warning"}>
                    {selectedArtifact.qa.errors.length === 0 ? "QA Passed" : "QA Issues"}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Segment: {SEGMENT_PROFILES[selectedArtifact.segment].name}
                </DialogDescription>
              </DialogHeader>
              <ArtifactDetail artifact={selectedArtifact} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Artifact Card Component
function ArtifactCard({
  artifact,
  onCopy,
  onExport,
  onView,
  isCopied,
}: {
  artifact: ContentArtifact;
  onCopy: (text: string) => void;
  onExport: () => void;
  onView: () => void;
  isCopied: boolean;
}) {
  const fullContent = `${artifact.hook}\n\n${artifact.body}`;
  const qaPass = artifact.qa.errors.length === 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="brand">
              {PLATFORM_CONFIGS[artifact.platform].name}
            </Badge>
            <Badge variant="outline">
              {SEGMENT_PROFILES[artifact.segment].name}
            </Badge>
          </div>
          <Badge variant={qaPass ? "success" : "warning"}>
            {qaPass ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
            {qaPass ? "QA Pass" : "QA Issues"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <p className="font-semibold text-brand-primary">{artifact.hook}</p>
          <p className="mt-2 text-muted-foreground line-clamp-3">{artifact.body.slice(0, 200)}...</p>
        </div>

        {/* Hashtags */}
        <div className="flex flex-wrap gap-1">
          {artifact.hashtags.map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onCopy(fullContent)}>
            {isCopied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
            {isCopied ? "Copied!" : "Copy"}
          </Button>
          <Button size="sm" variant="outline" onClick={onExport}>
            <Download className="h-4 w-4 mr-1" />
            JSON
          </Button>
          <Button size="sm" variant="outline" onClick={onView}>
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Artifact Detail Component
function ArtifactDetail({ artifact }: { artifact: ContentArtifact }) {
  return (
    <Tabs defaultValue="content" className="mt-4">
      <TabsList className="w-full">
        <TabsTrigger value="content" className="flex-1">Content</TabsTrigger>
        <TabsTrigger value="frameworks" className="flex-1">Frameworks</TabsTrigger>
        <TabsTrigger value="visual" className="flex-1">Visual</TabsTrigger>
        <TabsTrigger value="growth" className="flex-1">Growth</TabsTrigger>
        <TabsTrigger value="qa" className="flex-1">QA</TabsTrigger>
      </TabsList>

      <TabsContent value="content" className="space-y-4 mt-4">
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-2">Hook</h4>
          <p className="text-lg font-medium">{artifact.hook}</p>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-2">Body</h4>
          <div className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md">
            {artifact.body}
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-2">Hashtags</h4>
          <div className="flex flex-wrap gap-2">
            {artifact.hashtags.map((tag, i) => (
              <Badge key={i} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </div>
        {artifact.seoTags && artifact.seoTags.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">SEO Tags</h4>
            <div className="flex flex-wrap gap-2">
              {artifact.seoTags.map((tag, i) => (
                <Badge key={i} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="frameworks" className="space-y-4 mt-4">
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-2">Triple S Method</h4>
          <div className="space-y-3 bg-muted p-4 rounded-md">
            <div>
              <span className="font-medium text-brand-primary">STOP:</span> {artifact.tripleS.stop.hook}
              <Badge className="ml-2" variant="outline">{artifact.tripleS.stop.fiveC}</Badge>
            </div>
            <div>
              <span className="font-medium text-brand-primary">STAY:</span> {artifact.tripleS.stay.story}
            </div>
            <div>
              <span className="font-medium text-brand-primary">SHARE:</span>
              <ul className="list-disc list-inside ml-4 mt-1">
                {artifact.tripleS.share.takeaways.map((t, i) => (
                  <li key={i} className="text-sm">{t}</li>
                ))}
              </ul>
              <p className="mt-2 text-sm italic">CTA: {artifact.tripleS.share.cta}</p>
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-2">S.O.F.T. Framework</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted p-3 rounded-md">
              <span className="font-medium text-brand-primary">S - Separate:</span>
              <p className="text-sm mt-1">{artifact.soft.separate}</p>
            </div>
            <div className="bg-muted p-3 rounded-md">
              <span className="font-medium text-brand-primary">O - Own:</span>
              <p className="text-sm mt-1">{artifact.soft.own}</p>
            </div>
            <div className="bg-muted p-3 rounded-md">
              <span className="font-medium text-brand-primary">F - Filter:</span>
              <p className="text-sm mt-1">{artifact.soft.filter}</p>
            </div>
            <div className="bg-muted p-3 rounded-md">
              <span className="font-medium text-brand-primary">T - Thrive:</span>
              <p className="text-sm mt-1">{artifact.soft.thrive}</p>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="visual" className="space-y-4 mt-4">
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-2">AI Image Prompt</h4>
          <div className="bg-muted p-4 rounded-md text-sm">
            {artifact.visual.prompt}
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-2">Brand Palette</h4>
          <div className="flex gap-2">
            {artifact.visual.palette.map((color, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-md border"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs font-mono">{color}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-2">Quote Card Options</h4>
          <div className="space-y-2">
            {artifact.visual.quoteCardTextOptions.map((quote, i) => (
              <div key={i} className="bg-muted p-3 rounded-md text-sm italic">
                "{quote}"
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="growth" className="space-y-4 mt-4">
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-2">Best Posting Times</h4>
          <div className="flex flex-wrap gap-2">
            {artifact.growth.bestPostingTimes.map((time, i) => (
              <Badge key={i} variant="outline">{time}</Badge>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-2">Repurposing Ideas</h4>
          <ul className="list-disc list-inside space-y-1">
            {artifact.growth.repurposingIdeas.map((idea, i) => (
              <li key={i} className="text-sm">{idea}</li>
            ))}
          </ul>
        </div>
        {artifact.growth.abVariants && artifact.growth.abVariants.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">A/B Hook Variants</h4>
            <div className="space-y-2">
              {artifact.growth.abVariants.map((variant, i) => (
                <div key={i} className="bg-muted p-3 rounded-md">
                  <Badge className="mb-2">{variant.label}</Badge>
                  <p className="text-sm">{variant.hook}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="qa" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <QABadge label="Authenticity" pass={artifact.qa.authenticityPass} />
          <QABadge label="Brand Voice" pass={artifact.qa.brandVoicePass} />
          <QABadge label="Cultural Sensitivity" pass={artifact.qa.culturalSensitivityPass} />
          <QABadge label="Business Relevance" pass={artifact.qa.businessRelevancePass} />
        </div>
        {artifact.qa.errors.length > 0 && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Validation Issues</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {artifact.qa.errors.map((error, i) => (
                  <li key={i} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </TabsContent>
    </Tabs>
  );
}

function QABadge({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div className={`p-3 rounded-md flex items-center gap-2 ${pass ? "bg-green-50" : "bg-yellow-50"}`}>
      {pass ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <AlertCircle className="h-4 w-4 text-yellow-600" />
      )}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
