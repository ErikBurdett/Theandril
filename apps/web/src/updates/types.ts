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
