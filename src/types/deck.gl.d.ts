declare module '@deck.gl/react' {
  import { ComponentType } from 'react';
  
  export interface DeckGLProps {
    initialViewState?: Record<string, unknown>;
    viewState?: Record<string, unknown>;
    onViewStateChange?: (params: { viewState: Record<string, unknown> }) => void;
    layers?: unknown[];
    onClick?: (info: PickingInfo) => void;
    controller?: boolean;
    useDevicePixels?: boolean;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }
  
  const DeckGL: ComponentType<DeckGLProps>;
  export default DeckGL;
}

declare module '@deck.gl/layers' {
  export class ScatterplotLayer<D = unknown> {
    constructor(props: {
      id: string;
      data: D[];
      pickable?: boolean;
      opacity?: number;
      stroked?: boolean;
      filled?: boolean;
      radiusScale?: number;
      radiusMinPixels?: number;
      radiusMaxPixels?: number;
      lineWidthMinPixels?: number;
      getPosition: (d: D) => [number, number] | [number, number, number];
      getRadius?: number | ((d: D) => number);
      getFillColor?: [number, number, number, number] | ((d: D) => [number, number, number, number]);
      getLineColor?: [number, number, number, number] | ((d: D) => [number, number, number, number]);
      updateTriggers?: Record<string, unknown[]>;
    });
  }
  
  export class GeoJsonLayer {
    constructor(props: {
      id: string;
      data: string | object;
      filled?: boolean;
      stroked?: boolean;
      getFillColor?: number[];
      getLineColor?: number[];
      lineWidthMinPixels?: number;
    });
  }
}

declare module '@deck.gl/core' {
  export interface PickingInfo {
    object?: unknown;
    x?: number;
    y?: number;
    coordinate?: [number, number];
    layer?: unknown;
  }
  
  export class _GlobeView {
    constructor(props?: {
      id?: string;
      controller?: boolean;
    });
  }
}
