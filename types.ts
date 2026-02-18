export interface TimelineStep {
  image: string;
  video: string;
}

export interface GenerationState {
  isGeneratingPrompts: boolean;
  isRendering: boolean;
  renderingStep: number;
  error: string | null;
}

export type TimelineFrame = string | null;