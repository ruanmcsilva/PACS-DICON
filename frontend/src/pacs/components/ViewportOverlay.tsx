import React, { useEffect, useState } from 'react';
import * as cornerstone from '@cornerstonejs/core';

interface ViewportOverlayProps {
  element: HTMLDivElement | null;
  seriesDescription?: string;
}

export default function ViewportOverlay({ element, seriesDescription }: ViewportOverlayProps) {
  const [zoom, setZoom] = useState<string>('100');
  const [windowWidth, setWindowWidth] = useState<string>('-');
  const [windowCenter, setWindowCenter] = useState<string>('-');
  const [sliceIndex, setSliceIndex] = useState<number>(1);
  const [totalSlices, setTotalSlices] = useState<number>(1);
  const [imageDimensions, setImageDimensions] = useState<string>('');
  const [spacing, setSpacing] = useState<{ x: string, y: string }>({ x: '-', y: '-' });
  const [thickness, setThickness] = useState<string>('-');

  useEffect(() => {
    if (!element) return;

    const onCameraModified = (evt: any) => {
      const { viewportId, renderingEngineId } = evt.detail;
      const engine = cornerstone.getRenderingEngine(renderingEngineId);
      if (engine) {
        const vp = engine.getViewport(viewportId) as any;
        if (vp && vp.getZoom) {
          setZoom((vp.getZoom() * 100).toFixed(0));
        }
      }
    };

    const onVoiModified = (evt: any) => {
      const { range } = evt.detail;
      if (range) {
        const width = range.upper - range.lower;
        const center = range.lower + width / 2;
        setWindowWidth(width.toFixed(0));
        setWindowCenter(center.toFixed(0));
      }
    };

    const onImageRendered = (evt: any) => {
      const { viewportId, renderingEngineId } = evt.detail;
      const engine = cornerstone.getRenderingEngine(renderingEngineId);
      if (!engine) return;
      
      const vp = engine.getViewport(viewportId) as any;
      
      if (vp && vp.getCurrentImageIdIndex) {
        const currentIndex = vp.getCurrentImageIdIndex();
        const ids = vp.getImageIds();
        
        if (ids && ids.length > 0) {
          setSliceIndex(currentIndex + 1);
          setTotalSlices(ids.length);

          const currentImageId = ids[currentIndex];
          const imagePlaneModule = cornerstone.metaData.get('imagePlaneModule', currentImageId);
          
          if (imagePlaneModule) {
            if (imagePlaneModule.pixelSpacing) {
              setSpacing({
                x: parseFloat(imagePlaneModule.pixelSpacing[0]).toFixed(2),
                y: parseFloat(imagePlaneModule.pixelSpacing[1]).toFixed(2)
              });
            }
            if (imagePlaneModule.sliceThickness) {
              setThickness(parseFloat(imagePlaneModule.sliceThickness).toFixed(2));
            }
            if (imagePlaneModule.columns && imagePlaneModule.rows) {
              setImageDimensions(`${imagePlaneModule.columns} x ${imagePlaneModule.rows}`);
            }
          }
        }
        
        // Try getting W/L if not caught by VOI
        setWindowWidth((prev) => {
          if (prev === '-' || prev === 'NaN') {
            const props = vp.getProperties();
            if (props && props.voiRange) {
                const width = props.voiRange.upper - props.voiRange.lower;
                const center = props.voiRange.lower + width / 2;
                setWindowCenter(center.toFixed(0));
                return width.toFixed(0);
            }
          }
          return prev;
        });
        
        // Try getting zoom if not caught by Camera
        setZoom((prev) => {
          if (prev === '100' && vp.getZoom) {
            return (vp.getZoom() * 100).toFixed(0);
          }
          return prev;
        });
      }
    };

    element.addEventListener(cornerstone.Enums.Events.CAMERA_MODIFIED, onCameraModified);
    element.addEventListener(cornerstone.Enums.Events.VOI_MODIFIED, onVoiModified);
    element.addEventListener(cornerstone.Enums.Events.IMAGE_RENDERED, onImageRendered);

    return () => {
      element.removeEventListener(cornerstone.Enums.Events.CAMERA_MODIFIED, onCameraModified);
      element.removeEventListener(cornerstone.Enums.Events.VOI_MODIFIED, onVoiModified);
      element.removeEventListener(cornerstone.Enums.Events.IMAGE_RENDERED, onImageRendered);
    };
  }, [element]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', color: '#e5e7eb', fontSize: '13px', fontFamily: 'monospace', textShadow: '1px 1px 2px black', zIndex: 20 }}>
      {/* Bottom Left */}
      <div style={{ position: 'absolute', bottom: '16px', left: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ color: '#38bdf8', fontWeight: 'bold' }}>{seriesDescription || 'Serie Desconhecida'}</div>
        <div>Img: {sliceIndex} ({sliceIndex}/{totalSlices})</div>
        <div>{imageDimensions}</div>
        <div>Thick: {thickness} mm  Spacing: {spacing.x} mm</div>
      </div>

      {/* Bottom Right */}
      <div style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
        <div>Zoom: {zoom}%</div>
        <div>Lossless / Uncompressed</div>
        <div>W {windowWidth} L {windowCenter}</div>
      </div>
    </div>
  );
}
