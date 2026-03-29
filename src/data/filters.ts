export interface MapFilters {
  activeTypes: Set<string>;
  selectedRegion: string;
  severityRange: [number, number];
  overlays: {
    heatmap: boolean;
    clusters: boolean;
    borders: boolean;
  };
}
