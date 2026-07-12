import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import {
  LayoutGrid, ChevronUp, ChevronDown, Play, Film,
  Search, Contrast, Move, Ruler, MessageSquare,
  Square, Circle, Shapes, Pointer, Scan, Trash2, MoreHorizontal, MousePointer2, Layers,
  Video, VideoOff, Rewind, FastForward
} from 'lucide-react';
import { pacsService } from '../services/api';
import initCornerstone from '../utils/initCornerstone';
import type { IInstance, ISeries } from '../types';
import ViewportOverlay from './ViewportOverlay';

const Divider = () => <div style={{ width: '1px', height: '32px', backgroundColor: '#27272a', margin: '0 4px' }} />;

const ToolButton = ({ icon, label, active = false, onClick }: any) => {
  const [hover, setHover] = React.useState(false);
  const color = active || hover ? '#38bdf8' : '#a1a1aa';
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '6px 8px',
        borderRadius: '8px',
        backgroundColor: hover ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        minWidth: '52px',
        transition: 'all 0.1s ease',
      }}
    >
      <div style={{ color, display: 'flex' }}>{icon}</div>
      <span style={{ color, fontSize: '10px', fontWeight: 600 }}>{label}</span>
    </button>
  );
};

export default function Viewer() {
  const { studyId } = useParams<{ studyId: string }>();
  const navigate = useNavigate();
  
  // DOM Refs
  const viewerRef = useRef<HTMLDivElement>(null);
  const axialRef = useRef<HTMLDivElement>(null);
  const sagittalRef = useRef<HTMLDivElement>(null);
  const coronalRef = useRef<HTMLDivElement>(null);
  const vrRef = useRef<HTMLDivElement>(null);

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

  // UI States
  const [isSeriesListOpen, setIsSeriesListOpen] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const fpsList = [2, 5, 10, 15, 20, 30];
  const [fpsIndex, setFpsIndex] = useState(2); // 10 FPS default
  const [isRecording, setIsRecording] = useState(false);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const cineSpeed = Math.round(1000 / fpsList[fpsIndex]);

  // Navigation Logic
  const navigateSlice = (direction: number) => {
    const engine = cornerstone.getRenderingEngine('myRenderingEngine');
    if (!engine) return;
    const viewports = engine.getViewports();
    viewports.forEach(vp => {
      const viewport: any = vp;
      if (typeof viewport.scroll === 'function') {
        viewport.scroll(direction);
      }
    });
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playIntervalRef.current = setInterval(() => {
        navigateSlice(1);
      }, cineSpeed);
    }
  };

  const speedUp = () => {
    if (fpsIndex < fpsList.length - 1) {
      const nextIndex = fpsIndex + 1;
      setFpsIndex(nextIndex);
      updatePlayInterval(nextIndex);
    }
  };

  const slowDown = () => {
    if (fpsIndex > 0) {
      const prevIndex = fpsIndex - 1;
      setFpsIndex(prevIndex);
      updatePlayInterval(prevIndex);
    }
  };

  const updatePlayInterval = (index: number) => {
    if (isPlaying) {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
      const interval = Math.round(1000 / fpsList[index]);
      playIntervalRef.current = setInterval(() => {
        navigateSlice(1);
      }, interval);
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      const canvas = viewerRef.current?.querySelector('canvas');
      if (!canvas) {
        alert('Não foi possível encontrar a tela de visualização para gravar.');
        return;
      }

      try {
        const stream = (canvas as any).captureStream ? (canvas as any).captureStream(fpsList[fpsIndex]) : (canvas as any).mozCaptureStream(fpsList[fpsIndex]);
        chunksRef.current = [];
        const options = { mimeType: 'video/webm;codecs=vp9' };
        let recorder: MediaRecorder;
        
        try {
          recorder = new MediaRecorder(stream, options);
        } catch (e) {
          recorder = new MediaRecorder(stream);
        }

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `cine_${activeSeriesId || 'exame'}.webm`;
          a.click();
          URL.revokeObjectURL(url);
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecording(true);

        // Auto start playing if not already playing
        if (!isPlaying) {
          setIsPlaying(true);
          playIntervalRef.current = setInterval(() => {
            navigateSlice(1);
          }, cineSpeed);
        }
      } catch (err) {
        console.error('Erro ao iniciar a gravação:', err);
        alert('Erro ao iniciar a gravação do CINE.');
      }
    }
  };

  useEffect(() => {
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Volume MPR / VR / MIP states
  const [viewMode, setViewMode] = useState<'2D' | 'MPR_GRID'>('2D');
  const [mipBlendMode, setMipBlendMode] = useState<'VR' | 'MIP'>('VR');

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
      cornerstoneTools.RectangleROITool.toolName,
      cornerstoneTools.EllipticalROITool.toolName,
      cornerstoneTools.ArrowAnnotateTool.toolName,
      cornerstoneTools.PlanarFreehandROITool.toolName
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

  // Efeito principal do Cornerstone (reage ao activeSeriesId e viewMode)
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
        const baseUrl = "http://localhost:8000";
        const imageIds = data.map(inst => `wadouri:${baseUrl}/api/pacs/instances/${inst.id}/file`);

        // 3. Initialize Cornerstone
        await initCornerstone();
        if (!isMounted) return;

        // Previne crash do React Strict Mode destruindo instâncias órfãs
        const existingEngine = cornerstone.getRenderingEngine(renderingEngineId);
        if (existingEngine) {
          existingEngine.destroy();
        }

        // 4. Create Rendering Engine
        renderingEngine = new cornerstone.RenderingEngine(renderingEngineId);
        const viewportIds: string[] = [];

        if (viewMode === '2D') {
          if (!viewerRef.current) return;
          const viewportInput = {
            viewportId,
            type: cornerstone.Enums.ViewportType.STACK,
            element: viewerRef.current,
            defaultOptions: {
              background: [0, 0, 0] as [number, number, number],
            },
          };
          renderingEngine.enableElement(viewportInput);
          viewportIds.push(viewportId);

          // Resize observer to handle dynamic layout sizes
          resizeObserver = new ResizeObserver(() => {
            const engine = cornerstone.getRenderingEngine(renderingEngineId);
            if (engine) {
              engine.resize(true, false);
            }
          });
          resizeObserver.observe(viewerRef.current);
        } else {
          // MPR Grid: verify all 4 refs are loaded in DOM
          if (!axialRef.current || !sagittalRef.current || !coronalRef.current || !vrRef.current) {
            console.warn("Refs para a grade MPR não encontradas.");
            return;
          }

          const viewportInputArray = [
            {
              viewportId: 'AXIAL',
              type: cornerstone.Enums.ViewportType.ORTHOGRAPHIC,
              element: axialRef.current,
              defaultOptions: {
                orientation: cornerstone.Enums.OrientationAxis.AXIAL,
                background: [0, 0, 0] as [number, number, number],
              },
            },
            {
              viewportId: 'SAGITTAL',
              type: cornerstone.Enums.ViewportType.ORTHOGRAPHIC,
              element: sagittalRef.current,
              defaultOptions: {
                orientation: cornerstone.Enums.OrientationAxis.SAGITTAL,
                background: [0, 0, 0] as [number, number, number],
              },
            },
            {
              viewportId: 'CORONAL',
              type: cornerstone.Enums.ViewportType.ORTHOGRAPHIC,
              element: coronalRef.current,
              defaultOptions: {
                orientation: cornerstone.Enums.OrientationAxis.CORONAL,
                background: [0, 0, 0] as [number, number, number],
              },
            },
            {
              viewportId: '3D_VR',
              type: cornerstone.Enums.ViewportType.VOLUME_3D,
              element: vrRef.current,
              defaultOptions: {
                background: [0.05, 0.05, 0.05] as [number, number, number],
              },
            },
          ];

          renderingEngine.setViewports(viewportInputArray);
          viewportIds.push('AXIAL', 'SAGITTAL', 'CORONAL', '3D_VR');

          // Resize observer on all 4 components
          resizeObserver = new ResizeObserver(() => {
            const engine = cornerstone.getRenderingEngine(renderingEngineId);
            if (engine) {
              engine.resize(true, false);
            }
          });
          resizeObserver.observe(axialRef.current);
          resizeObserver.observe(sagittalRef.current);
          resizeObserver.observe(coronalRef.current);
          resizeObserver.observe(vrRef.current);
        }

        // 5. Setup Tools
        cornerstoneTools.addTool(cornerstoneTools.WindowLevelTool);
        cornerstoneTools.addTool(cornerstoneTools.PanTool);
        cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
        cornerstoneTools.addTool(cornerstoneTools.StackScrollTool);
        
        cornerstoneTools.addTool(cornerstoneTools.LengthTool);
        cornerstoneTools.addTool(cornerstoneTools.AngleTool);
        cornerstoneTools.addTool(cornerstoneTools.ProbeTool);
        cornerstoneTools.addTool(cornerstoneTools.RectangleROITool);
        cornerstoneTools.addTool(cornerstoneTools.EllipticalROITool);
        cornerstoneTools.addTool(cornerstoneTools.ArrowAnnotateTool);
        cornerstoneTools.addTool(cornerstoneTools.PlanarFreehandROITool);

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
          toolGroup.addTool(cornerstoneTools.EllipticalROITool.toolName);
          toolGroup.addTool(cornerstoneTools.ArrowAnnotateTool.toolName);
          toolGroup.addTool(cornerstoneTools.PlanarFreehandROITool.toolName);

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
          toolGroup.setToolPassive(cornerstoneTools.EllipticalROITool.toolName);
          toolGroup.setToolPassive(cornerstoneTools.ArrowAnnotateTool.toolName);
          toolGroup.setToolPassive(cornerstoneTools.PlanarFreehandROITool.toolName);

          viewportIds.forEach(vpId => {
            toolGroup.addViewport(vpId, renderingEngineId);
          });
        }

        console.log("6. Loading images into viewport...");
        try {
          if (viewMode === '2D') {
            const viewport = renderingEngine.getViewport(viewportId) as cornerstone.Types.IStackViewport;
            await viewport.setStack(imageIds, 0);
            viewport.render();

            // 7. Restaurar Anotações Salvas (se existirem)
            try {
              const saved = await pacsService.getAnnotations(activeSeriesId);
              if (saved && saved.data) {
                  const annotationManager = cornerstoneTools.annotation.state.getAnnotationManager();
                  annotationManager.restoreAnnotations(saved.data);
                  viewport.render();
              }
            } catch (annErr) {
              console.log("Nenhuma anotação prévia encontrada para esta série.");
            }
          } else {
            // Volume creation for MPR/VR
            // Para 'wadouri', precisamos que os metadados já estejam carregados antes de criar o volume.
            const volumeId = `cornerstoneUID:${activeSeriesId}`;
            let volume = cornerstone.cache.getVolume(volumeId);
            if (!volume) {
              console.log("Pré-carregando imagens para extrair metadados do volume 3D/MPR...");
              // Carregamos em lotes para não sobrecarregar o navegador com dezenas/centenas de requisições simultâneas
              const batchSize = 10;
              for (let i = 0; i < imageIds.length; i += batchSize) {
                const batch = imageIds.slice(i, i + batchSize);
                await Promise.all(batch.map(id => cornerstone.imageLoader.loadAndCacheImage(id)));
              }
              console.log("Metadados carregados. Construindo o volume...");

              volume = await cornerstone.volumeLoader.createAndCacheVolume(volumeId, { imageIds });
            }
            await volume.load();

            const vpAxial = renderingEngine.getViewport('AXIAL') as cornerstone.Types.IVolumeViewport;
            const vpSagittal = renderingEngine.getViewport('SAGITTAL') as cornerstone.Types.IVolumeViewport;
            const vpCoronal = renderingEngine.getViewport('CORONAL') as cornerstone.Types.IVolumeViewport;
            const vpVR = renderingEngine.getViewport('3D_VR') as cornerstone.Types.IVolumeViewport;

            await vpAxial.setVolume(volumeId);
            await vpSagittal.setVolume(volumeId);
            await vpCoronal.setVolume(volumeId);
            await vpVR.setVolume(volumeId);

            // Apply blend mode logic
            if (mipBlendMode === 'MIP') {
              vpVR.setProperties({ blendMode: cornerstone.Enums.BlendModes.MIP });
            } else {
              vpVR.setProperties({ blendMode: cornerstone.Enums.BlendModes.COMPOSITE });
              try {
                const actor = vpVR.getActor(volumeId);
                if (actor && actor.actor) {
                  actor.actor.getProperty().setShading(true);
                  actor.actor.getProperty().setInterpolationTypeToLinear();
                }
              } catch (actorErr) {
                console.warn("Could not set 3D VR actor properties", actorErr);
              }
            }
            renderingEngine.render();
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
  }, [activeSeriesId, viewMode]);

  // Efeito dinâmico para alternar o BlendMode do Viewport 3D sem recarregar a engine
  useEffect(() => {
    if (viewMode === 'MPR_GRID') {
      try {
        const engine = cornerstone.getRenderingEngine('myRenderingEngine');
        if (engine) {
          const vpVR = engine.getViewport('3D_VR') as cornerstone.Types.IVolumeViewport;
          if (vpVR) {
            const volumeId = `cornerstoneUID:${activeSeriesId}`;
            if (mipBlendMode === 'MIP') {
              vpVR.setProperties({ blendMode: cornerstone.Enums.BlendModes.MIP });
            } else {
              vpVR.setProperties({ blendMode: cornerstone.Enums.BlendModes.COMPOSITE });
              const actor = vpVR.getActor(volumeId);
              if (actor && actor.actor) {
                actor.actor.getProperty().setShading(true);
              }
            }
            vpVR.render();
          }
        }
      } catch (e) {
        console.warn("Erro ao atualizar BlendMode 3D:", e);
      }
    }
  }, [mipBlendMode, viewMode, activeSeriesId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: 'black', color: 'white', position: 'absolute', top: 0, left: 0, zIndex: 50 }}>
      {/* Toolbar - OHIF Style */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 16px', backgroundColor: '#000000', borderBottom: '1px solid #27272a', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Logo / Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '200px' }}>
          <div style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>
            <span style={{ color: '#38bdf8' }}>PACS</span> Viewer
          </div>
        </div>

        {/* Ferramentas Centrais */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', overflowX: 'auto' }}>
          {/* Nav */}
          <ToolButton icon={<LayoutGrid size={20}/>} label="Series" active={isSeriesListOpen} onClick={() => setIsSeriesListOpen(!isSeriesListOpen)} />
          <ToolButton icon={<ChevronUp size={20}/>} label="Previous" onClick={() => navigateSlice(-1)} />
          <ToolButton icon={<ChevronDown size={20}/>} label="Next" onClick={() => navigateSlice(1)} />
          <ToolButton icon={<Play size={20}/>} label={`${isPlaying ? "Pausar" : "Play"} (${fpsList[fpsIndex]} FPS)`} active={isPlaying} onClick={togglePlay} />
          <ToolButton icon={<Rewind size={20}/>} label="Lento" onClick={slowDown} disabled={fpsIndex === 0} />
          <ToolButton icon={<FastForward size={20}/>} label="Rápido" onClick={speedUp} disabled={fpsIndex === fpsList.length - 1} />
          <ToolButton 
            icon={isRecording ? <VideoOff size={20} color="#ef4444" /> : <Video size={20} />} 
            label={isRecording ? "Parar Gravação" : "Gravar CINE"} 
            onClick={handleToggleRecording} 
            active={isRecording}
          />
          
          <Divider />

          {/* Layout */}
          <ToolButton 
            icon={<LayoutGrid size={20}/>} 
            label="Layout" 
            active={viewMode === 'MPR_GRID'} 
            onClick={() => setViewMode(viewMode === '2D' ? 'MPR_GRID' : '2D')} 
          />

          {viewMode === 'MPR_GRID' && (
            <div style={{ display: 'flex', border: '1px solid #27272a', borderRadius: '4px', overflow: 'hidden', marginLeft: '4px' }}>
              <button onClick={() => setMipBlendMode('VR')} style={{ padding: '4px 8px', backgroundColor: mipBlendMode === 'VR' ? '#38bdf8' : 'transparent', color: mipBlendMode === 'VR' ? 'black' : '#a1a1aa', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}>VR</button>
              <button onClick={() => setMipBlendMode('MIP')} style={{ padding: '4px 8px', backgroundColor: mipBlendMode === 'MIP' ? '#38bdf8' : 'transparent', color: mipBlendMode === 'MIP' ? 'black' : '#a1a1aa', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}>MIP</button>
            </div>
          )}

          <Divider />

          {/* View */}
          <ToolButton icon={<Search size={20}/>} label="Zoom (Z)" active={activeTool === cornerstoneTools.ZoomTool.toolName} onClick={() => handleToolSelect(cornerstoneTools.ZoomTool.toolName)} />
          <ToolButton icon={<Contrast size={20}/>} label="Levels (L)" active={activeTool === cornerstoneTools.WindowLevelTool.toolName} onClick={() => handleToolSelect(cornerstoneTools.WindowLevelTool.toolName)} />
          <ToolButton icon={<Move size={20}/>} label="Pan (P)" active={activeTool === cornerstoneTools.PanTool.toolName} onClick={() => handleToolSelect(cornerstoneTools.PanTool.toolName)} />
          
          <Divider />

          {/* Tools */}
          <ToolButton icon={<Ruler size={20}/>} label="Length" active={activeTool === cornerstoneTools.LengthTool.toolName} onClick={() => handleToolSelect(cornerstoneTools.LengthTool.toolName)} />
          <ToolButton icon={<MessageSquare size={20}/>} label="Annotate" active={activeTool === cornerstoneTools.ArrowAnnotateTool.toolName} onClick={() => handleToolSelect(cornerstoneTools.ArrowAnnotateTool.toolName)} />
          <ToolButton icon={<Shapes size={20}/>} label="Angle" active={activeTool === cornerstoneTools.AngleTool.toolName} onClick={() => handleToolSelect(cornerstoneTools.AngleTool.toolName)} />
          <ToolButton icon={<Circle size={20}/>} label="Ellipse" active={activeTool === cornerstoneTools.EllipticalROITool.toolName} onClick={() => handleToolSelect(cornerstoneTools.EllipticalROITool.toolName)} />
          <ToolButton icon={<Square size={20}/>} label="Rectangle" active={activeTool === cornerstoneTools.RectangleROITool.toolName} onClick={() => handleToolSelect(cornerstoneTools.RectangleROITool.toolName)} />
          <ToolButton icon={<Pointer size={20}/>} label="ROI" active={activeTool === cornerstoneTools.PlanarFreehandROITool.toolName} onClick={() => handleToolSelect(cornerstoneTools.PlanarFreehandROITool.toolName)} />
          
          <Divider />

          {/* Advanced */}
          <ToolButton icon={<Scan size={20}/>} label="Segment" onClick={() => alert('O Módulo de Segmentação 3D requer inicialização prévia de mapas de rótulos (Labelmaps). Faremos na próxima etapa se desejar continuar.')} />
          <ToolButton icon={<Trash2 size={20}/>} label="Delete" onClick={() => {
             // Simple delete implementation: clear all annotations
             const annotationManager = cornerstoneTools.annotation.state.getAnnotationManager();
             annotationManager.removeAllAnnotations();
             const engine = cornerstone.getRenderingEngine('myRenderingEngine');
             engine?.render();
          }} />
          <ToolButton icon={<MoreHorizontal size={20}/>} label="More" onClick={() => {}} />
        </div>

        {/* Right Actions (Laudar, Salvar) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '200px', justifyContent: 'flex-end' }}>
            <button onClick={() => setIsReportPanelOpen(!isReportPanelOpen)} style={{ padding: '6px 12px', borderRadius: '4px', backgroundColor: 'transparent', color: isReportPanelOpen ? '#38bdf8' : '#a1a1aa', border: '1px solid #27272a', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
              {isReportPanelOpen ? 'Fechar' : 'Laudar'}
            </button>
            <button onClick={handleSaveAnnotations} style={{ padding: '6px 12px', borderRadius: '4px', backgroundColor: 'transparent', color: '#a1a1aa', border: '1px solid #27272a', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
              Salvar
            </button>
            <button onClick={() => navigate('/')} style={{ padding: '6px 12px', borderRadius: '4px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #27272a', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
              Sair
            </button>
        </div>
      </div>

      {/* Content Area (Sidebar + Viewer) */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Sidebar de Séries */}
        {isSeriesListOpen && (
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
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '8px',
                    cursor: 'pointer',
                    opacity: activeSeriesId === series.id ? 1 : 0.6,
                    transition: 'all 0.2s',
                    backgroundColor: activeSeriesId === series.id ? '#1f2937' : 'transparent',
                    borderRadius: '8px'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = activeSeriesId === series.id ? '1' : '0.6')}
                >
                  {/* Thumbnail Box Placeholder */}
                  <div style={{ 
                    width: '100%', 
                    height: '130px', 
                    backgroundColor: '#000000', 
                    border: activeSeriesId === series.id ? '2px solid #38bdf8' : '2px solid #374151', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                     <span style={{ color: '#4b5563', fontSize: '11px', fontWeight: 'bold' }}>{series.modality} Preview</span>
                  </div>
                  
                  {/* Meta Info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '4px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f3f4f6', maxWidth: '65%', wordWrap: 'break-word', lineHeight: '1.2' }}>
                      {series.series_description || 'Sem descrição'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.7rem', color: '#9ca3af', gap: '2px' }}>
                      <div><span style={{ color: '#38bdf8', fontWeight: 'bold' }}>S:</span> {series.series_number !== null ? series.series_number : '?'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Layers size={12} color="#38bdf8" />
                        <span>{series.id === activeSeriesId ? instances.length : '--'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Area do Visualizador */}
        <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }} onContextMenu={(e) => e.preventDefault()}>
          {isRecording && (
            <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 30, display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '20px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%', display: 'inline-block', animation: 'rec-pulse 1.5s infinite' }} />
              <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}>REC</span>
              <style>{`
                @keyframes rec-pulse {
                  0% { opacity: 0.3; }
                  50% { opacity: 1; }
                  100% { opacity: 0.3; }
                }
              `}</style>
            </div>
          )}
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

          {viewMode === '2D' ? (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <div ref={viewerRef} style={{ width: '100%', height: '100%', outline: 'none' }} />
              <ViewportOverlay 
                element={viewerRef.current} 
                seriesDescription={activeSeriesId ? seriesList.find(s => s.id === activeSeriesId)?.series_description || seriesList.find(s => s.id === activeSeriesId)?.modality : ''} 
              />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', width: '100%', height: '100%', backgroundColor: '#111827', gap: '2px', padding: '2px' }}>
              {/* Axial Viewport */}
              <div style={{ position: 'relative', border: '1px solid #374151', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 10, fontSize: '0.75rem', fontWeight: 600, color: '#3b82f6', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px' }}>AXIAL</div>
                <div ref={axialRef} style={{ width: '100%', height: '100%', outline: 'none' }} />
              </div>
              
              {/* Sagittal Viewport */}
              <div style={{ position: 'relative', border: '1px solid #374151', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 10, fontSize: '0.75rem', fontWeight: 600, color: '#10b981', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px' }}>SAGITAL</div>
                <div ref={sagittalRef} style={{ width: '100%', height: '100%', outline: 'none' }} />
              </div>
              
              {/* Coronal Viewport */}
              <div style={{ position: 'relative', border: '1px solid #374151', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 10, fontSize: '0.75rem', fontWeight: 600, color: '#8b5cf6', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px' }}>CORONAL</div>
                <div ref={coronalRef} style={{ width: '100%', height: '100%', outline: 'none' }} />
              </div>
              
              {/* 3D / VR Viewport */}
              <div style={{ position: 'relative', border: '1px solid #374151', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 10, fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px' }}>
                  RECONSTRUÇÃO 3D ({mipBlendMode === 'MIP' ? 'MIP' : 'VR'})
                </div>
                <div ref={vrRef} style={{ width: '100%', height: '100%', outline: 'none' }} />
              </div>
            </div>
          )}
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
