export type Topic = 'Engineering' | 'World & culture' | 'Archives';
export type Evidence = { label: string; path: string; note: string };
export type DispatchSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  image?: string;
};
export type Dispatch = {
  // Unreviewed drafts belong in docs/work branches, never in this shipped catalog.
  publication: 'published';
  sourceRevision: string;
  sequence: number;
  id: string;
  edition: string;
  title: string;
  subtitle: string;
  summary: string;
  topic: Topic;
  tags: string[];
  status: 'Reviewed checkpoint' | 'Playable baseline' | 'Bounded verification';
  checkpoint: string;
  image: string;
  takeaways: string[];
  sections: DispatchSection[];
  evidence: Evidence[];
};
export type ScopeEntry = { id: string; title: string; state: 'Accepted scope' | 'Current / partial' | 'Open gate' | 'Proposal / deferred' | 'Not this update'; description: string; path: string };

export type RoadmapStatus = 'completed' | 'in-progress' | 'pending';
export type ReleaseGateId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'F2' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N';
export type RoadmapStage = { id: string; title: string; description: string };
export type RoadmapItem = {
  id: string;
  stage: string;
  title: string;
  status: RoadmapStatus;
  summary: string;
  delivered: string[];
  remaining: string[];
  gates: ReleaseGateId[];
  evidence: Evidence[];
};
export type ReleaseGate = {
  id: ReleaseGateId;
  title: string;
  // No overall release gate has been accepted at the current source snapshot.
  status: Exclude<RoadmapStatus, 'completed'>;
  remaining: string;
};
