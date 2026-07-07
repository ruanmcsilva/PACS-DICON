import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import { pacsService } from '../services/api';
import initCornerstone from '../utils/initCornerstone';
import type { Instance } from '../types';

export default function Viewer() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();
  const viewerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instances, setInstances] = useState<Instance[]>([]);

  useEffect(() => {
    let renderingEngine: cornerstone.RenderingEngine;
    const renderingEngineId = 'myRenderingEngine';
    const viewportId = 'CT_STACK';
    const toolGroupId = 'STACK_TOOL_GROUP';

    const setupViewer = async () => {
      try {
        if (!seriesId) return;

        // 1. Fetch instances from backend
        const data = await pacsService.getInstances(seriesId);
        setInstances(data);

        if (data.length === 0) {
          setError("Nenhuma imagem encontrada nesta série.");
          setLoading(false);
          return;
        }

        // 2. Format Image IDs for cornerstone (using wadouri scheme)
        // Adjust the base URL to your backend
        const baseUrl = "http://localhost:8000";
        const imageIds = data.map(inst => `wadouri:${baseUrl}/api/pacs/instances/${inst.id}/file`);

        // 3. Initialize Cornerstone
        await initCornerstone();

        if (!viewerRef.current) return;

        // 4. Create Rendering Engine and Viewport
        renderingEngine = new cornerstone.RenderingEngine(renderingEngineId);

        const viewportInput = {
          viewportId,
          type: cornerstone.Enums.ViewportType.STACK,
          element: viewerRef.current,
          defaultOptions: {
            background: [0, 0, 0] as [number, number, number],
          },
        };

        renderingEngine.enableElement(viewportInput);
        const viewport = renderingEngine.getViewport(viewportId) as cornerstone.Types.IStackViewport;

        // 5. Setup Tools
        cornerstoneTools.addTool(cornerstoneTools.WindowLevelTool);
        cornerstoneTools.addTool(cornerstoneTools.PanTool);
        cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
        cornerstoneTools.addTool(cornerstoneTools.StackScrollTool);

        // Remove old group if exists
        cornerstoneTools.ToolGroupManager.destroyToolGroup(toolGroupId);
        const toolGroup = cornerstoneTools.ToolGroupManager.createToolGroup(toolGroupId);

        if (toolGroup) {
          toolGroup.addTool(cornerstoneTools.WindowLevelTool.toolName);
          toolGroup.addTool(cornerstoneTools.PanTool.toolName);
          toolGroup.addTool(cornerstoneTools.ZoomTool.toolName);
          toolGroup.addTool(cornerstoneTools.StackScrollTool.toolName);

          toolGroup.setToolActive(cornerstoneTools.WindowLevelTool.toolName, {
            bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Primary }],
          });
          toolGroup.setToolActive(cornerstoneTools.PanTool.toolName, {
            bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Auxiliary }],
          });
          toolGroup.setToolActive(cornerstoneTools.ZoomTool.toolName, {
            bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Secondary }],
          });
          toolGroup.setToolActive(cornerstoneTools.StackScrollTool.toolName, {
            bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Wheel }],
          });

          toolGroup.addViewport(viewportId, renderingEngineId);
        }

        console.log("6. Loading images into viewport...");
        console.log("Image IDs:", imageIds);
        
        try {
          console.log("Testing manual image load...");
          const img = await cornerstone.imageLoader.loadAndCacheImage(imageIds[0]);
          console.log("Image loaded manually successfully!", img);
          
          await viewport.setStack(imageIds, 0);
          console.log("setStack resolvido com sucesso!");
          viewport.render();
          console.log("viewport.render() chamado com sucesso!");
        } catch (stackErr) {
          console.error("Erro interno do setStack/load:", stackErr);
          throw stackErr;
        }

        setLoading(false);
      } catch (err: any) {
        console.error("Erro ao carregar o viewer:", err);
        setError(`Erro ao inicializar o visualizador DICOM: ${err.message || String(err)}`);
        setLoading(false);
      }
    };

    setupViewer();

    return () => {
      // Cleanup
      if (renderingEngine) {
        renderingEngine.destroy();
      }
      cornerstoneTools.ToolGroupManager.destroyToolGroup(toolGroupId);
    };
  }, [seriesId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: 'black', color: 'white', position: 'absolute', top: 0, left: 0, zIndex: 50 }}>
      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', backgroundColor: '#111827', borderBottom: '1px solid #374151' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
            Viewer <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#9ca3af' }}>({instances.length} imagens)</span>
          </h2>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
            <span>Mouse Esquerdo: Brilho/Contraste</span>
            <span>Mouse Direito: Zoom</span>
            <span>Scroll: Passar Imagens</span>
          </div>
        </div>
        <button 
          onClick={() => navigate('/')}
          style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#1f2937', color: 'white', border: '1px solid #4b5563', cursor: 'pointer' }}
        >
          Voltar para Lista
        </button>
      </div>

      {/* Viewer Area */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: 'calc(100vh - 70px)', overflow: 'hidden' }} onContextMenu={(e) => e.preventDefault()}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10 }}>
            <p style={{ color: 'white' }}>Carregando Imagens DICOM...</p>
          </div>
        )}
        
        {error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'black', zIndex: 10 }}>
            <p style={{ color: 'red' }}>{error}</p>
          </div>
        )}

        <div 
          ref={viewerRef} 
          style={{ width: '100%', height: '100%', outline: 'none' }}
        />
      </div>
    </div>
  );
}
