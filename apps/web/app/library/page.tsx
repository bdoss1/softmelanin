"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ContentArtifact, Segment, Platform, SEGMENT_PROFILES, PLATFORM_CONFIGS } from "@soft-melanin/shared";
import { Copy, Download, Trash2, AlertCircle, CheckCircle, Library, Filter } from "lucide-react";

export default function LibraryPage() {
  const [artifacts, setArtifacts] = useState<ContentArtifact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [selectedArtifact, setSelectedArtifact] = useState<ContentArtifact | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");

  const fetchArtifacts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (platformFilter !== "all") params.set("platform", platformFilter);
      if (segmentFilter !== "all") params.set("segment", segmentFilter);

      const response = await fetch(`/api/artifacts?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setArtifacts(data.artifacts);
        setTotal(data.total);
      } else {
        setError(data.error || "Failed to fetch artifacts");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArtifacts();
  }, [platformFilter, segmentFilter]);

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
    a.download = `soft-melanin-${artifact.platform}-${artifact.segment}-${artifact.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteArtifact = async (id: string) => {
    if (!confirm("Are you sure you want to delete this artifact?")) return;

    try {
      const response = await fetch(`/api/artifacts?id=${id}`, { method: "DELETE" });
      if (response.ok) {
        setArtifacts((prev) => prev.filter((a) => a.id !== id));
        setTotal((prev) => prev - 1);
      }
    } catch (err) {
      alert("Failed to delete artifact");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Library className="h-6 w-6 text-brand-primary" />
              Content Library
            </h1>
            <p className="text-muted-foreground">
              Browse and manage your generated content ({total} artifacts)
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-4">
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="linkedin_founder">LinkedIn Founder</SelectItem>
                    <SelectItem value="linkedin_company">LinkedIn Company</SelectItem>
                    <SelectItem value="substack">Substack</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Filter by segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Segments</SelectItem>
                    <SelectItem value="overextended_professional">Overextended Professional</SelectItem>
                    <SelectItem value="healing_high_achiever">Healing High-Achiever</SelectItem>
                    <SelectItem value="creative_reclaimer">Creative Reclaimer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : artifacts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Library className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No artifacts found. Generate some content first!</p>
            <Button className="mt-4" variant="brand" onClick={() => window.location.href = "/"}>
              Go to Generator
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {artifacts.map((artifact) => (
            <LibraryCard
              key={artifact.id}
              artifact={artifact}
              onCopy={(text) => copyToClipboard(text, artifact.id!)}
              onExport={() => exportJSON(artifact)}
              onDelete={() => deleteArtifact(artifact.id!)}
              onView={() => setSelectedArtifact(artifact)}
              isCopied={copiedId === artifact.id}
            />
          ))}
        </div>
      )}

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
                  {selectedArtifact.createdAt && (
                    <span className="ml-2">
                      | Created: {new Date(selectedArtifact.createdAt).toLocaleDateString()}
                    </span>
                  )}
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

function LibraryCard({
  artifact,
  onCopy,
  onExport,
  onDelete,
  onView,
  isCopied,
}: {
  artifact: ContentArtifact;
  onCopy: (text: string) => void;
  onExport: () => void;
  onDelete: () => void;
  onView: () => void;
  isCopied: boolean;
}) {
  const fullContent = `${artifact.hook}\n\n${artifact.body}`;
  const qaPass = artifact.qa.errors.length === 0;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="brand" className="text-xs">
            {PLATFORM_CONFIGS[artifact.platform].name}
          </Badge>
          <Badge variant={qaPass ? "success" : "warning"} className="text-xs">
            {qaPass ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {SEGMENT_PROFILES[artifact.segment].name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="font-medium text-sm text-brand-primary line-clamp-2">{artifact.hook}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{artifact.body.slice(0, 100)}...</p>

        <div className="flex flex-wrap gap-1">
          {artifact.hashtags.slice(0, 3).map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {artifact.hashtags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{artifact.hashtags.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex gap-1 pt-2">
          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => onCopy(fullContent)}>
            <Copy className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={onExport}>
            <Download className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 px-2 text-destructive" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" className="h-8 ml-auto" onClick={onView}>
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ArtifactDetail({ artifact }: { artifact: ContentArtifact }) {
  return (
    <Tabs defaultValue="content" className="mt-4">
      <TabsList className="w-full">
        <TabsTrigger value="content" className="flex-1">Content</TabsTrigger>
        <TabsTrigger value="frameworks" className="flex-1">Frameworks</TabsTrigger>
        <TabsTrigger value="visual" className="flex-1">Visual</TabsTrigger>
        <TabsTrigger value="growth" className="flex-1">Growth</TabsTrigger>
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
                <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: color }} />
                <span className="text-xs font-mono">{color}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-2">Quote Card Options</h4>
          <div className="space-y-2">
            {artifact.visual.quoteCardTextOptions.map((quote, i) => (
              <div key={i} className="bg-muted p-3 rounded-md text-sm italic">"{quote}"</div>
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
      </TabsContent>
    </Tabs>
  );
}
