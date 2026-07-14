import React, { useEffect, useRef, useState } from 'react';
import * as cornerstone from '@cornerstonejs/core';
import { pacsService } from '../services/api';
import initCornerstone from '../utils/initCornerstone';

interface SeriesThumbnailProps {
  seriesId: string;
  seriesInstanceUid: string;
  studyInstanceUid: string;
  active: boolean;
}

const SeriesThumbnail: React.FC<SeriesThumbnailProps> = ({ seriesId, seriesInstanceUid, studyInstanceUid, active }) => {
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let renderingEngine: cornerstone.RenderingEngine | undefined;
    // UUIDs for engine and viewport to prevent collisions
    const renderingEngineId = `thumb_engine_${seriesId}`;
    const viewportId = `thumb_vp_${seriesId}`;

    const loadThumbnail = async () => {
      try {
        setLoading(true);
        // 1. Fetch instances for this series
        const instances = await pacsService.getInstances(seriesId);
        
        if (!isMounted) return;
        if (!instances || instances.length === 0) {
          throw new Error('No instances found');
        }

        // We use the middle instance to get a good preview, or the first if small
        const midIndex = Math.floor(instances.length / 2);
        const targetInstance = instances[midIndex];
        
        const baseUrl = "http://localhost:8000";
        let imageId = "";
        if (studyInstanceUid && seriesInstanceUid) {
          imageId = `wadouri:${baseUrl}/api/dicom-web/studies/${studyInstanceUid}/series/${seriesInstanceUid}/instances/${targetInstance.sop_instance_uid}`;
        } else {
          imageId = `wadouri:${baseUrl}/api/pacs/instances/${targetInstance.id}/file`;
        }

        // Initialize Cornerstone and pre-load the image to cache
        await initCornerstone();
        if (!isMounted) return;

        await cornerstone.imageLoader.loadAndCacheImage(imageId);
        if (!isMounted) return;

        // Cleanup existing engine if any
        const existingEngine = cornerstone.getRenderingEngine(renderingEngineId);
        if (existingEngine) {
          existingEngine.destroy();
        }

        renderingEngine = new cornerstone.RenderingEngine(renderingEngineId);
        
        if (!thumbnailRef.current) return;

        renderingEngine.enableElement({
          viewportId,
          type: cornerstone.Enums.ViewportType.STACK,
          element: thumbnailRef.current,
          defaultOptions: {
            background: [0, 0, 0],
          }
        });

        const viewport = renderingEngine.getViewport(viewportId) as cornerstone.Types.IStackViewport;
        await viewport.setStack([imageId], 0);
        viewport.render();

        setLoading(false);
      } catch (err) {
        console.error("Error loading thumbnail for series", seriesId, err);
        if (isMounted) setError(true);
      }
    };

    loadThumbnail();

    return () => {
      isMounted = false;
      if (renderingEngine) {
        renderingEngine.destroy();
      }
    };
  }, [seriesId, studyInstanceUid, seriesInstanceUid]);

  return (
    <div style={{ 
      width: '100%', 
      height: '130px', 
      backgroundColor: '#000000', 
      border: active ? '2px solid #38bdf8' : '2px solid #374151', 
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      pointerEvents: 'none' // Prevent interactions
    }}>
      {loading && !error && (
        <div style={{ position: 'absolute', color: '#4b5563', fontSize: '11px', fontWeight: 'bold' }}>
          Carregando Preview...
        </div>
      )}
      {error && (
        <div style={{ position: 'absolute', color: '#ef4444', fontSize: '11px', fontWeight: 'bold' }}>
          Sem Preview
        </div>
      )}
      <div 
        ref={thumbnailRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          opacity: loading || error ? 0 : 1,
          transition: 'opacity 0.3s ease-in'
        }} 
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
};

export default SeriesThumbnail;
