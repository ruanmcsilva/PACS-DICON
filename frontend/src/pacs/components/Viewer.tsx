import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import { pacsService } from '../services/api';
import initCornerstone from '../utils/initCornerstone';
import type { IInstance, ISeries } from '../types';

export default function Viewer() {
  const { studyId } = useParams<{ studyId: string }>();
  const navigate = useNavigate();
  const viewerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seriesList, setSeriesList] = useState<ISeries[]>([]);
  const [activeSeriesId, setActiveSeriesId] = useState<string | null>(null);
  const [instances, setInstances] = useState<IInstance[]>([]);
  const [activeTool, setActiveTool] = useState<string>(cornerstoneTools.WindowLevelTool.toolName);
  const [isReportPanelOpen, setIsReportPanelOpen] = useState(false);
  const [reportContent, setReportContent] = useState("");
  const [reportStatus, setReportStatus] = useState<"DRAFT" | "FINAL">("DRAFT");
  const [generatingAi, setGeneratingAi] = useState(false);

  const handleToolSelect = (toolName: string) => {
    setActiveTool(toolName);
    const toolGroupId = 'STACK_TOOL_GROUP';
    const toolGroup = cornerstoneTools.ToolGroupManager.getToolGroup(toolGroupId);
    if (!toolGroup) return;

    const primaryTools = [
      cornerstoneTools.WindowLevelTool.toolName,
      cornerstoneTools.PanTool.toolName,
      cornerstoneTools.ZoomTool.toolName,
      cornerstoneTools.LengthTool.toolName,
      cornerstoneTools.AngleTool.toolName,
      cornerstoneTools.ProbeTool.toolName,
      cornerstoneTools.RectangleROITool.toolName
    ];

    primaryTools.forEach((tool) => {
      if (tool === toolName) {
        toolGroup.setToolActive(tool, {
          bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Primary }],
        });
      } else {
        // Restaurar bindings padrões das ferramentas principais para botões secundários
        if (tool === cornerstoneTools.PanTool.toolName) {
          toolGroup.setToolActive(tool, { bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Auxiliary }]});
        } else if (tool === cornerstoneTools.ZoomTool.toolName) {
          toolGroup.setToolActive(tool, { bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Secondary }]});
        } else {
          toolGroup.setToolPassive(tool);
        }
      }
    });
  };

  const handleSaveAnnotations = async () => {
    if (!activeSeriesId) return;
    try {
      const annotationManager = cornerstoneTools.annotation.state.getAnnotationManager();
      const state = annotationManager.saveAnnotations();
      
      await pacsService.saveAnnotations(activeSeriesId, state);
      alert('Anotações salvas com sucesso!');
    } catch (err) {
      console.error("Erro ao salvar anotações:", err);
      alert('Erro ao salvar anotações.');
    }
  };

  const handleSaveReport = async () => {
    try {
      if (!studyId) return;
      await pacsService.saveReport(studyId, reportContent, reportStatus);
      alert('Laudo salvo com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar laudo.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGenerateAiDraft = async () => {
    if (!studyId) return;
    try {
      setGeneratingAi(true);
      const report = await pacsService.generateAiDraft(studyId);
      setReportContent(report.content);
      setReportStatus(report.status);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar laudo com I.A.');
    } finally {
      setGeneratingAi(false);
    }
  };

  // Buscar a lista de séries do Estudo
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        if (!studyId) return;
        setLoading(true);
        const data = await pacsService.getSeries(studyId);
        setSeriesList(data);
        if (data.length > 0) {
          setActiveSeriesId(data[0].id);
        } else {
          setError("Nenhuma série encontrada neste estudo.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Erro ao buscar séries", err);
        setError("Erro ao buscar séries do estudo.");
        setLoading(false);
      }
    };
    fetchSeries();
  }, [studyId]);

  // Buscar laudo do Estudo
  useEffect(() => {
    const fetchReport = async () => {
      try {
        if (!studyId) return;
        const report = await pacsService.getReport(studyId);
        if (report) {
          setReportContent(report.content || "");
          setReportStatus(report.status || "DRAFT");
        }
      } catch (err) {
        console.log("Nenhum laudo prévio encontrado.");
      }
    };
    fetchReport();
  }, [studyId]);

  // Efeito principal do Cornerstone (agora reage ao activeSeriesId)
  useEffect(() => {
    let renderingEngine: cornerstone.RenderingEngine;
    let resizeObserver: ResizeObserver;
    const renderingEngineId = 'myRenderingEngine';
    const viewportId = 'CT_STACK';
    const toolGroupId = 'STACK_TOOL_GROUP';
    let isMounted = true;

    const setupViewer = async () => {
      try {
        if (!activeSeriesId) return;

        // 1. Fetch instances from backend
        const data = await pacsService.getInstances(activeSeriesId);
        if (!isMounted) return;
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
        if (!isMounted) return;

        if (!viewerRef.current) return;

        // Previne crash do React Strict Mode destruindo instâncias órfãs
        const existingEngine = cornerstone.getRenderingEngine(renderingEngineId);
        if (existingEngine) {
          existingEngine.destroy();
        }

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

        // Resize observer to handle dynamic layout sizes
        resizeObserver = new ResizeObserver(() => {
          const engine = cornerstone.getRenderingEngine(renderingEngineId);
          if (engine) {
            engine.resize(true, false);
          }
        });
        resizeObserver.observe(viewerRef.current);

        // 5. Setup Tools
        cornerstoneTools.addTool(cornerstoneTools.WindowLevelTool);
        cornerstoneTools.addTool(cornerstoneTools.PanTool);
        cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
        cornerstoneTools.addTool(cornerstoneTools.StackScrollTool);
        
        // NOVO: Measurement Tools
        cornerstoneTools.addTool(cornerstoneTools.LengthTool);
        cornerstoneTools.addTool(cornerstoneTools.AngleTool);
        cornerstoneTools.addTool(cornerstoneTools.ProbeTool);
        cornerstoneTools.addTool(cornerstoneTools.RectangleROITool);

        // Remove old group if exists
        cornerstoneTools.ToolGroupManager.destroyToolGroup(toolGroupId);
        const toolGroup = cornerstoneTools.ToolGroupManager.createToolGroup(toolGroupId);

        if (toolGroup) {
          toolGroup.addTool(cornerstoneTools.WindowLevelTool.toolName);
          toolGroup.addTool(cornerstoneTools.PanTool.toolName);
          toolGroup.addTool(cornerstoneTools.ZoomTool.toolName);
          toolGroup.addTool(cornerstoneTools.StackScrollTool.toolName);
          toolGroup.addTool(cornerstoneTools.LengthTool.toolName);
          toolGroup.addTool(cornerstoneTools.AngleTool.toolName);
          toolGroup.addTool(cornerstoneTools.ProbeTool.toolName);
          toolGroup.addTool(cornerstoneTools.RectangleROITool.toolName);

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

          // Ferramentas de medição em modo Passivo inicialmente
          toolGroup.setToolPassive(cornerstoneTools.LengthTool.toolName);
          toolGroup.setToolPassive(cornerstoneTools.AngleTool.toolName);
          toolGroup.setToolPassive(cornerstoneTools.ProbeTool.toolName);
          toolGroup.setToolPassive(cornerstoneTools.RectangleROITool.toolName);

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

          // 7. Restaurar Anotações Salvas (se existirem)
          try {
            const saved = await pacsService.getAnnotations(activeSeriesId);
            if (saved && saved.data) {
                const annotationManager = cornerstoneTools.annotation.state.getAnnotationManager();
                annotationManager.restoreAnnotations(saved.data);
                viewport.render();
                console.log("Anotações restauradas com sucesso.");
            }
          } catch (annErr) {
            console.log("Nenhuma anotação prévia encontrada para esta série.");
          }

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
      isMounted = false;
      // Cleanup
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (renderingEngine) {
        renderingEngine.destroy();
      }
      cornerstoneTools.ToolGroupManager.destroyToolGroup(toolGroupId);
    };
  }, [activeSeriesId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: 'black', color: 'white', position: 'absolute', top: 0, left: 0, zIndex: 50 }}>
      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', backgroundColor: '#111827', borderBottom: '1px solid #374151' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
            Viewer <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#9ca3af' }}>({instances.length} imagens)</span>
          </h2>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
            <span>Mouse Esquerdo: Ação da Ferramenta Ativa</span>
            <span>Mouse Meio: Mover</span>
            <span>Mouse Direito: Zoom</span>
            <span>Scroll: Passar Imagens</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setIsReportPanelOpen(!isReportPanelOpen)}
            style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: isReportPanelOpen ? '#4b5563' : '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            {isReportPanelOpen ? '❌ Fechar Laudo' : '📝 Laudar'}
          </button>
          <button 
            onClick={handleSaveAnnotations}
            style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'background-color 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            💾 Salvar Anotações
          </button>
          <button 
            onClick={() => navigate('/')}
            style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#1f2937', color: 'white', border: '1px solid #4b5563', cursor: 'pointer' }}
          >
            Voltar para Lista
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '8px', padding: '8px 24px', backgroundColor: '#1f2937', borderBottom: '1px solid #374151', overflowX: 'auto' }}>
        {[
          { name: cornerstoneTools.WindowLevelTool.toolName, label: 'W/L (Brilho)' },
          { name: cornerstoneTools.PanTool.toolName, label: 'Mover' },
          { name: cornerstoneTools.ZoomTool.toolName, label: 'Zoom' },
          { name: cornerstoneTools.LengthTool.toolName, label: '📏 Régua' },
          { name: cornerstoneTools.AngleTool.toolName, label: '📐 Ângulo' },
          { name: cornerstoneTools.ProbeTool.toolName, label: '📍 Pixel' },
          { name: cornerstoneTools.RectangleROITool.toolName, label: '⬛ ROI Retângulo' },
        ].map(tool => (
          <button
            key={tool.name}
            onClick={() => handleToolSelect(tool.name)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: activeTool === tool.name ? '#3b82f6' : '#374151',
              color: activeTool === tool.name ? 'white' : '#d1d5db',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {tool.label}
          </button>
        ))}
      </div>

      {/* Content Area (Sidebar + Viewer) */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Sidebar de Séries */}
        <div style={{ width: '280px', backgroundColor: '#111827', borderRight: '1px solid #374151', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #374151' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#e5e7eb' }}>Séries do Exame</h3>
          </div>
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {seriesList.map(series => (
              <div 
                key={series.id}
                onClick={() => setActiveSeriesId(series.id)}
                style={{
                  padding: '12px',
                  backgroundColor: activeSeriesId === series.id ? '#1f2937' : 'transparent',
                  border: activeSeriesId === series.id ? '1px solid #3b82f6' : '1px solid #374151',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f3f4f6' }}>{series.modality}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>{series.series_description || 'Sem descrição'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Viewer Area */}
        <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }} onContextMenu={(e) => e.preventDefault()}>
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

        {/* Right Sidebar (Report) */}
        {isReportPanelOpen && (
          <div style={{ width: '320px', backgroundColor: '#111827', borderLeft: '1px solid #374151', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#e5e7eb' }}>Laudo Médico</h3>
              <select 
                value={reportStatus}
                onChange={(e) => setReportStatus(e.target.value)}
                style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#1f2937', color: 'white', border: '1px solid #4b5563' }}
              >
                <option value="DRAFT">Rascunho</option>
                <option value="FINAL">Finalizado</option>
              </select>
            </div>
            <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <textarea 
                value={reportContent}
                onChange={(e) => setReportContent(e.target.value)}
                placeholder="Digite os achados radiológicos..."
                style={{ flex: 1, backgroundColor: '#1f2937', color: 'white', border: '1px solid #374151', borderRadius: '8px', padding: '12px', resize: 'none', fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
            <div style={{ padding: '16px', borderTop: '1px solid #374151', display: 'flex', gap: '8px', flexDirection: 'column' }}>
              <button 
                onClick={handleGenerateAiDraft}
                disabled={generatingAi}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)', color: 'white', border: 'none', cursor: generatingAi ? 'not-allowed' : 'pointer', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: generatingAi ? 0.7 : 1 }}
              >
                {generatingAi ? '⏳ Analisando com I.A...' : '✨ Gerar Pré-laudo com I.A.'}
              </button>
              <button 
                onClick={handleSaveReport}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Salvar Laudo
              </button>
              <button 
                onClick={handlePrint}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                🖨️ Exportar PDF / Imprimir
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Print Area (Oculta na tela, visível apenas no PDF) */}
      <div className="print-area">
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
          <div style={{ borderBottom: '2px solid black', paddingBottom: '20px', marginBottom: '20px' }}>
            <h1 style={{ margin: 0, fontSize: '24px' }}>HOSPITAL PACS ENTERPRISE</h1>
            <p style={{ margin: '4px 0 0 0', color: '#555' }}>Relatório Oficial de Diagnóstico por Imagem</p>
          </div>
          
          <div style={{ marginBottom: '30px' }}>
            <p><strong>ID do Estudo:</strong> {studyId}</p>
            <p><strong>Status do Laudo:</strong> {reportStatus}</p>
            <p><strong>Data de Emissão:</strong> {new Date().toLocaleDateString()}</p>
          </div>
          
          <div style={{ minHeight: '300px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Achados Médicos:</h3>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {reportContent || "Nenhum laudo redigido ainda."}
            </div>
          </div>
          
          <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #ccc', textAlign: 'center' }}>
            <p style={{ margin: 0 }}>_________________________________________________</p>
            <p style={{ marginTop: '8px', fontWeight: 'bold' }}>Assinatura do Médico Radiologista</p>
          </div>
        </div>
      </div>
    </div>
  );
}
