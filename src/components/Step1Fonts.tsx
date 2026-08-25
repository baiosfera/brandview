import { Component, createSignal, For, Show } from 'solid-js';
import { 
  brandData, 
  envatoFonts, 
  gridCols, 
  setFloatingPanel, 
  activeSelection, 
  setActiveSelection, 
  clearSelection,
  elementsStore, 
  setElementsStore,
  selectedEcosystem,
  setSelectedEcosystem,
  setDefinitiveFromCanvas,
  globalFullscreen,
  currentStep,
  setCurrentStep,
  cards,
  setCards,
  brandInitials,
  setBrandInitials,
  brandDisplayName,
  setBrandDisplayName,
  brandSlogan,
  setBrandSlogan,
  showEcosystemsSection,
  setShowEcosystemsSection,
  extractAndReloadEnvatoFonts,
  type FontEcosystem,
  type ElementStyle,
  type CanvasCardState
} from '../state';
import { loadFontDynamically } from '../utils/fontLoader';

export const Step1Fonts: Component = () => {
  const [isExtracting, setIsExtracting] = createSignal(false);
  const [extractMsg, setExtractMsg] = createSignal('');

  const ecosystems = (): FontEcosystem[] => brandData.font_manifest?.candidate_ecosystems || [
    {
      id: 'eco-1',
      name: `${brandDisplayName()} — Ecosistema Principal`,
      archetype: 'Estructura & Distinción Visual',
      rationale: 'Elegancia contemporánea de alto contraste.',
      tokens: {
        display_primary: { $value: 'Rising', source: 'envato' },
        ui_secondary: { $value: 'Plus Jakarta Sans', source: 'google_fonts' },
        accent_brand: { $value: 'Calestra', source: 'envato' }
      }
    }
  ];

  // Añadir un nuevo lienzo al workbench cargando un ecosistema con sus 6 capas funcionales (Punto 2.b)
  const addCanvasFromEcosystem = async (eco: FontEcosystem) => {
    const cleanFontName = (s?: string, fallback = 'Plus Jakarta Sans') => (s || fallback).replace(/[\s\—\-\:\;\,\.]+$/g, '').trim();

    const display = cleanFontName(eco.tokens.display_primary?.$value, 'Rising');
    const ui = cleanFontName(eco.tokens.ui_secondary?.$value, 'Plus Jakarta Sans');
    const accent = cleanFontName(eco.tokens.accent_brand?.$value, 'Calestra');

    const rawLayers = eco.layers || {};
    const layerLogo = cleanFontName(rawLayers.logo, accent);
    const layerSlogan = cleanFontName(rawLayers.slogan, display);
    const layerH1 = cleanFontName(rawLayers.h1, display);
    const layerH2 = cleanFontName(rawLayers.h2, display);
    const layerBody = cleanFontName(rawLayers.body, ui);
    const layerUi = cleanFontName(rawLayers.ui, ui);

    // Cargar automáticamente todas las fuentes requeridas en el navegador
    await Promise.all([
      loadFontDynamically(display),
      loadFontDynamically(ui),
      loadFontDynamically(accent),
      loadFontDynamically(layerLogo),
      loadFontDynamically(layerSlogan),
      loadFontDynamically(layerH1),
      loadFontDynamically(layerH2),
      loadFontDynamically(layerBody),
      loadFontDynamically(layerUi)
    ]);

    const newId = `canvas-${Date.now()}`;

    // Inicializar estilos de las 6 capas Gestalt en el store
    setElementsStore(`${newId}_initials`, {
      text: '',
      fontSize: 76,
      letterSpacing: 0.02,
      lineHeight: 1.0,
      fontFamily: layerLogo,
      textTransform: 'uppercase',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      ligatures: true,
      translateX: 0,
      translateY: 0,
      rotation: 0,
      mirror: false
    });

    setElementsStore(`${newId}_brand`, {
      text: '',
      fontSize: 36,
      letterSpacing: 0.04,
      lineHeight: 1.15,
      fontFamily: layerLogo,
      textTransform: 'none',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      ligatures: true,
      translateX: 0,
      translateY: 0,
      rotation: 0,
      mirror: false
    });

    setElementsStore(`${newId}_slogan`, {
      text: '',
      fontSize: 14,
      letterSpacing: 0.15,
      lineHeight: 1.2,
      fontFamily: layerSlogan,
      textTransform: 'uppercase',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      ligatures: true,
      translateX: 0,
      translateY: 0,
      rotation: 0,
      mirror: false
    });

    setElementsStore(`${newId}_h1`, {
      text: '',
      fontSize: 28,
      letterSpacing: 0.02,
      lineHeight: 1.2,
      fontFamily: layerH1,
      textTransform: 'none',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      ligatures: true,
      translateX: 0,
      translateY: 0,
      rotation: 0,
      mirror: false
    });

    setElementsStore(`${newId}_h2`, {
      text: '',
      fontSize: 15,
      letterSpacing: 0.03,
      lineHeight: 1.3,
      fontFamily: layerH2,
      textTransform: 'none',
      fontWeight: 'normal',
      fontStyle: 'italic',
      textAlign: 'left',
      ligatures: true,
      translateX: 0,
      translateY: 0,
      rotation: 0,
      mirror: false
    });

    setElementsStore(`${newId}_body`, {
      text: '',
      fontSize: 13,
      letterSpacing: 0.02,
      lineHeight: 1.6,
      fontFamily: layerBody,
      textTransform: 'none',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'justify',
      ligatures: true,
      translateX: 0,
      translateY: 0,
      rotation: 0,
      mirror: false
    });

    const isFirst = cards().length === 0;
    setCards([...cards(), {
      id: newId,
      fontFamily: display,
      theme: 'dark',
      zoom: 1,
      showLeft: true,
      showRight: true,
      mode: 'bloque',
      fullscreen: false,
      isDefinitive: isFirst
    }]);

    setSelectedEcosystem(eco);
    if (isFirst) {
      setDefinitiveFromCanvas(newId, display, eco.name);
    }
    // Auto-ocultar sección de candidatos al enviar al lienzo
    setShowEcosystemsSection(false);
  };

  // Añadir un lienzo básico por nombre de fuente
  const addCanvas = async (fontName: string, ecoTitle?: string) => {
    if (!fontName) return;
    const cleanFont = fontName.replace(/\.(otf|ttf|woff|woff2)$/i, '');
    await loadFontDynamically(cleanFont);
    const newId = `canvas-${Date.now()}`;
    const isFirst = cards().length === 0;
    setCards([...cards(), {
      id: newId,
      fontFamily: cleanFont,
      theme: 'dark',
      zoom: 1,
      showLeft: true,
      showRight: true,
      mode: 'bloque',
      fullscreen: false,
      isDefinitive: isFirst
    }]);

    if (isFirst) {
      setDefinitiveFromCanvas(newId, cleanFont, ecoTitle);
    }
    // Auto-ocultar sección de candidatos al enviar al lienzo
    setShowEcosystemsSection(false);
  };

  const removeCanvas = (id: string) => {
    setCards(cards().filter(c => c.id !== id));
  };

  const toggleTheme = (id: string) => {
    setCards(cards().map(c => c.id === id ? { ...c, theme: c.theme === 'light' ? 'dark' : 'light' } : c));
  };

  const toggleFullscreen = (id: string) => {
    setCards(cards().map(c => c.id === id ? { ...c, fullscreen: !c.fullscreen } : c));
  };

  const toggleColumn = (id: string, col: 'left' | 'right') => {
    setCards(cards().map(c => {
      if (c.id === id) {
        if (col === 'left') return { ...c, showLeft: !c.showLeft };
        return { ...c, showRight: !c.showRight };
      }
      return c;
    }));
  };

  const setCardZoom = (id: string, zoom: number) => {
    setCards(cards().map(c => c.id === id ? { ...c, zoom } : c));
  };

  const setCardMode = (id: string, mode: 'letra' | 'palabra' | 'bloque') => {
    setCards(cards().map(c => c.id === id ? { ...c, mode } : c));
  };

  // Marcar este lienzo editado como el Ecosistema Definitivo
  const markAsDefinitive = (card: CanvasCardState) => {
    setCards(cards().map(c => ({
      ...c,
      isDefinitive: c.id === card.id
    })));
    setDefinitiveFromCanvas(card.id, card.fontFamily);
  };

  // Obtener o inicializar estilos de un nodo específico
  const getNodeStyle = (cardId: string, itemId: string, defaultFont: string, defaultSize: number, defaultAlign: 'left' | 'center' | 'right' | 'justify' = 'center'): ElementStyle => {
    const key = `${cardId}_${itemId}`;
    if (!elementsStore[key]) {
      setElementsStore(key, {
        text: '',
        fontSize: defaultSize,
        letterSpacing: itemId === 'slogan' ? 0.15 : (itemId === 'initials' ? 0.02 : 0.04),
        lineHeight: itemId === 'initials' ? 1.0 : (itemId === 'body' ? 1.6 : 1.2),
        fontFamily: defaultFont,
        textTransform: itemId === 'slogan' || itemId === 'initials' ? 'uppercase' : 'none',
        fontWeight: 'normal',
        fontStyle: itemId === 'h2' ? 'italic' : 'normal',
        textAlign: defaultAlign,
        ligatures: true,
        translateX: 0,
        translateY: 0,
        rotation: 0,
        mirror: false
      });
    }
    return elementsStore[key];
  };

  // Seleccionar elemento y abrir panel flotante
  const selectElement = (cardId: string, itemId: string, label: string, defaultFont: string, defaultSize: number, defaultAlign: 'left' | 'center' | 'right' | 'justify' = 'center') => {
    const defStyle = getNodeStyle(cardId, itemId, defaultFont, defaultSize, defaultAlign);
    setActiveSelection({
      cardId,
      itemId,
      defaultStyle: { ...defStyle }
    });
    setFloatingPanel({
      visible: true,
      title: `Editando: ${label}`
    });
  };

  const isSelected = (cardId: string, itemId: string) => {
    const sel = activeSelection();
    return sel !== null && sel.cardId === cardId && sel.itemId === itemId;
  };

  // Arrastre con mouse optimizado a 60fps con requestAnimationFrame (Punto 3.f)
  let isDraggingNode = false;
  let dragCardId = '';
  let dragItemId = '';
  let startMouseX = 0;
  let startMouseY = 0;
  let initTransX = 0;
  let initTransY = 0;
  let wasDragged = false;
  let animFrameId: number | null = null;

  const handleMouseDown = (e: MouseEvent, cardId: string, itemId: string, cardZoom: number) => {
    if (e.button !== 0) return;
    isDraggingNode = true;
    wasDragged = false;
    dragCardId = cardId;
    dragItemId = itemId;
    startMouseX = e.clientX;
    startMouseY = e.clientY;

    const key = `${cardId}_${itemId}`;
    const style = elementsStore[key] || { translateX: 0, translateY: 0 };
    initTransX = style.translateX || 0;
    initTransY = style.translateY || 0;

    const onMouseMove = (moveEvt: MouseEvent) => {
      if (!isDraggingNode) return;
      const dx = moveEvt.clientX - startMouseX;
      const dy = moveEvt.clientY - startMouseY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) wasDragged = true;

      const finalX = initTransX + (dx / cardZoom);
      const finalY = initTransY + (dy / cardZoom);

      if (animFrameId) cancelAnimationFrame(animFrameId);
      animFrameId = requestAnimationFrame(() => {
        if (!elementsStore[key]) {
          getNodeStyle(cardId, itemId, 'Plus Jakarta Sans', 32);
        }
        setElementsStore(key, 'translateX', Math.round(finalX));
        setElementsStore(key, 'translateY', Math.round(finalY));
      });
    };

    const onMouseUp = () => {
      isDraggingNode = false;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    e.stopPropagation();
  };

  const resetCardPositions = (cardId: string) => {
    // 1. Reset zoom, paneles y modo bloque
    setCardZoom(cardId, 1);
    setCards(cards().map(c => c.id === cardId ? { ...c, zoom: 1, showLeft: true, showRight: true, mode: 'bloque' } : c));
    
    // 2. Eliminar todas las modificaciones subordinadas de palabras y letras
    const allKeys = Object.keys(elementsStore).filter(k => k.startsWith(`${cardId}_`));
    for (const k of allKeys) {
      if (k.includes('_w') || k.includes('_c')) {
        setElementsStore(k, undefined as any);
      }
    }

    // 3. Restaurar las 6 capas Gestalt a las fuentes y estilos originales del ecosistema
    const eco = selectedEcosystem();
    const cleanFontName = (s?: string, fallback = 'Plus Jakarta Sans') => (s || fallback).replace(/[\s\—\-\:\;\,\.]+$/g, '').trim();
    const display = cleanFontName(eco?.tokens.display_primary?.$value, 'Rising');
    const ui = cleanFontName(eco?.tokens.ui_secondary?.$value, 'Plus Jakarta Sans');
    const accent = cleanFontName(eco?.tokens.accent_brand?.$value, 'Calestra');
    const rawLayers = eco?.layers || {};

    const layerMap: Record<string, { font: string; size: number; spacing: number; align: 'left' | 'center' | 'right' | 'justify'; style: 'normal' | 'italic'; transform: 'none' | 'uppercase' }> = {
      initials: { font: cleanFontName(rawLayers.logo, accent), size: 76, spacing: 0.02, align: 'center', style: 'normal', transform: 'uppercase' },
      brand: { font: cleanFontName(rawLayers.logo, accent), size: 36, spacing: 0.04, align: 'center', style: 'normal', transform: 'none' },
      slogan: { font: cleanFontName(rawLayers.slogan, display), size: 14, spacing: 0.15, align: 'center', style: 'normal', transform: 'uppercase' },
      h1: { font: cleanFontName(rawLayers.h1, display), size: 28, spacing: 0.02, align: 'left', style: 'normal', transform: 'none' },
      h2: { font: cleanFontName(rawLayers.h2, display), size: 15, spacing: 0.03, align: 'left', style: 'italic', transform: 'none' },
      body: { font: cleanFontName(rawLayers.body, ui), size: 13, spacing: 0.02, align: 'justify', style: 'normal', transform: 'none' }
    };

    for (const [layerId, cfg] of Object.entries(layerMap)) {
      const key = `${cardId}_${layerId}`;
      setElementsStore(key, {
        text: '',
        fontSize: cfg.size,
        letterSpacing: cfg.spacing,
        lineHeight: layerId === 'body' ? 1.6 : (layerId === 'initials' ? 1.0 : 1.2),
        fontFamily: cfg.font,
        textTransform: cfg.transform,
        fontWeight: 'normal',
        fontStyle: cfg.style,
        textAlign: cfg.align,
        ligatures: true,
        translateX: 0,
        translateY: 0,
        rotation: 0,
        mirror: false
      });
    }

    clearSelection();
  };

  const handleExtractFonts = async () => {
    setIsExtracting(true);
    setExtractMsg('Extrayendo fuentes ZIP...');
    const count = await extractAndReloadEnvatoFonts();
    setIsExtracting(false);
    setExtractMsg(`${count} fuentes listas`);
    setTimeout(() => setExtractMsg(''), 3000);
  };

  const hasCardFullscreen = () => cards().some(c => c.fullscreen);

  // Renderizador de texto interactivo según Modo: Bloque, Palabra, Letra con Ligaduras en todos los modos
  const renderInteractiveContent = (
    textToRender: string,
    card: CanvasCardState,
    itemId: string,
    defaultFont: string,
    defaultSize: number,
    defaultAlign: 'left' | 'center' | 'right' | 'justify' = 'center'
  ) => {
    const blockStyle = getNodeStyle(card.id, itemId, defaultFont, defaultSize, defaultAlign);
    const text = blockStyle.text || textToRender;

    if (card.mode === 'palabra') {
      const tokens = text.split(/(\s+)/);
      return (
        <span class={`pointer-events-auto inline ${blockStyle.ligatures ? 'ligatures-active' : ''}`} style={{
          ...(blockStyle.ligatures ? {
            'font-feature-settings': '"liga" 1, "dlig" 1, "clig" 1, "calt" 1',
            'font-variant-ligatures': 'normal'
          } : {
            'font-feature-settings': '"liga" 0',
            'font-variant-ligatures': 'none'
          })
        }}>
          {tokens.map((token, idx) => {
            if (/^\s+$/.test(token)) {
              return <span>{token}</span>;
            }
            const wKey = `${itemId}_w${idx}`;
            const wStyle = elementsStore[`${card.id}_${wKey}`];
            const wordText = wStyle?.text || token;
            const isSel = isSelected(card.id, wKey);
            const isLig = wStyle?.ligatures !== undefined ? wStyle.ligatures : blockStyle.ligatures;

            return (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  selectElement(
                    card.id, 
                    wKey, 
                    `Palabra: "${token}"`, 
                    wStyle?.fontFamily || blockStyle.fontFamily || defaultFont, 
                    wStyle?.fontSize || blockStyle.fontSize || defaultSize, 
                    defaultAlign
                  );
                }}
                class={`inline transition cursor-pointer ${
                  isSel ? 'outline-dashed outline-2 outline-emerald-400 bg-emerald-500/20 rounded px-0.5' : 'hover:outline-dashed hover:outline-1 hover:outline-emerald-400/60 rounded px-0.5'
                } ${isLig ? 'ligatures-active' : ''}`}
                style={{
                  ...(wStyle?.fontFamily ? { 'font-family': `"${wStyle.fontFamily}", sans-serif` } : {}),
                  ...(wStyle?.fontSize ? { 'font-size': `${wStyle.fontSize}px` } : {}),
                  ...(wStyle?.letterSpacing !== undefined ? { 'letter-spacing': `${wStyle.letterSpacing}em` } : {}),
                  ...(wStyle?.fontWeight ? { 'font-weight': wStyle.fontWeight } : {}),
                  ...(wStyle?.fontStyle ? { 'font-style': wStyle.fontStyle } : {}),
                  ...(wStyle?.textTransform ? { 'text-transform': wStyle.textTransform } : {}),
                  ...(isLig ? {
                    'font-feature-settings': '"liga" 1, "dlig" 1, "clig" 1, "calt" 1',
                    'font-variant-ligatures': 'normal'
                  } : {
                    'font-feature-settings': '"liga" 0',
                    'font-variant-ligatures': 'none'
                  }),
                  ...(wStyle?.translateX || wStyle?.translateY || wStyle?.rotation || wStyle?.mirror ? {
                    'transform': `translate(${wStyle.translateX || 0}px, ${wStyle.translateY || 0}px) rotate(${wStyle.rotation || 0}deg) scaleX(${wStyle.mirror ? -1 : 1})`
                  } : {})
                }}
              >
                {wordText}
              </span>
            );
          })}
        </span>
      );
    }

    if (card.mode === 'letra') {
      const chars = text.split('');
      return (
        <span class={`pointer-events-auto inline ${blockStyle.ligatures ? 'ligatures-active' : ''}`} style={{
          ...(blockStyle.ligatures ? {
            'font-feature-settings': '"liga" 1, "dlig" 1, "clig" 1, "calt" 1',
            'font-variant-ligatures': 'normal'
          } : {
            'font-feature-settings': '"liga" 0',
            'font-variant-ligatures': 'none'
          })
        }}>
          {chars.map((c, cIdx) => {
            const cKey = `${itemId}_c${cIdx}`;
            const cStyle = elementsStore[`${card.id}_${cKey}`];
            const charText = cStyle?.text || c;
            const isSel = isSelected(card.id, cKey);
            const isLig = cStyle?.ligatures !== undefined ? cStyle.ligatures : blockStyle.ligatures;

            return (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  selectElement(
                    card.id, 
                    cKey, 
                    `Letra: "${c}"`, 
                    cStyle?.fontFamily || blockStyle.fontFamily || defaultFont, 
                    cStyle?.fontSize || blockStyle.fontSize || defaultSize, 
                    defaultAlign
                  );
                }}
                class={`inline transition cursor-pointer ${
                  isSel ? 'outline-dashed outline-2 outline-emerald-400 bg-emerald-500/20 rounded' : 'hover:outline-dashed hover:outline-1 hover:outline-emerald-400/60 rounded'
                } ${isLig ? 'ligatures-active' : ''}`}
                style={{
                  ...(cStyle?.fontFamily ? { 'font-family': `"${cStyle.fontFamily}", sans-serif` } : {}),
                  ...(cStyle?.fontSize ? { 'font-size': `${cStyle.fontSize}px` } : {}),
                  ...(cStyle?.letterSpacing !== undefined ? { 'letter-spacing': `${cStyle.letterSpacing}em` } : {}),
                  ...(cStyle?.fontWeight ? { 'font-weight': cStyle.fontWeight } : {}),
                  ...(cStyle?.fontStyle ? { 'font-style': cStyle.fontStyle } : {}),
                  ...(cStyle?.textTransform ? { 'text-transform': cStyle.textTransform } : {}),
                  ...(isLig ? {
                    'font-feature-settings': '"liga" 1, "dlig" 1, "clig" 1, "calt" 1',
                    'font-variant-ligatures': 'normal'
                  } : {
                    'font-feature-settings': '"liga" 0',
                    'font-variant-ligatures': 'none'
                  }),
                  ...(cStyle?.translateX || cStyle?.translateY || cStyle?.rotation || cStyle?.mirror ? {
                    'transform': `translate(${cStyle.translateX || 0}px, ${cStyle.translateY || 0}px) rotate(${cStyle.rotation || 0}deg) scaleX(${cStyle.mirror ? -1 : 1})`
                  } : {})
                }}
              >
                {charText === ' ' ? '\u00A0' : charText}
              </span>
            );
          })}
        </span>
      );
    }

    // Modo Bloque por defecto
    return (
      <span 
        class={blockStyle.ligatures ? 'ligatures-active' : ''}
        style={{
          ...(blockStyle.ligatures ? {
            'font-feature-settings': '"liga" 1, "dlig" 1, "clig" 1, "calt" 1',
            'font-variant-ligatures': 'normal'
          } : {
            'font-feature-settings': '"liga" 0',
            'font-variant-ligatures': 'none'
          })
        }}
      >
        {text}
      </span>
    );
  };

  return (
    <div 
      onClick={() => clearSelection()} 
      class="flex-1 flex flex-col overflow-hidden bg-gray-950"
    >
      
      {/* 3 Ecosistemas Fontgen Colapsables con Barra Completa Clickeable (Punto 2.c) */}
      <Show when={!globalFullscreen() && !hasCardFullscreen()}>
        <section class="bg-gray-900 border-b border-gray-800 shrink-0 transition-all shadow-md">
          <div 
            onClick={() => setShowEcosystemsSection(!showEcosystemsSection())}
            class="px-4 py-2.5 flex items-center justify-between border-b border-gray-800/80 cursor-pointer hover:bg-gray-850 transition select-none"
            title="Haz clic en cualquier parte de este encabezado para expandir u ocultar los ecosistemas"
          >
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <span>{showEcosystemsSection() ? '▲ Ocultar Ecosistemas Fontgen' : '▼ Mostrar Ecosistemas Fontgen'}</span>
                <span class="text-[10px] text-emerald-400 font-mono">({ecosystems().length} candidatos)</span>
              </span>
            </div>

            <div class="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <Show when={selectedEcosystem()}>
                <span class="text-[11px] font-bold text-emerald-400 bg-emerald-950/90 border border-emerald-800 px-2.5 py-0.5 rounded shadow-inner">
                  Definitivo: {(selectedEcosystem()?.tokens.display_primary?.$value || '').replace(/^Token[^\:]*\:\s*/i, '').replace(/[\s\—\-\:\;\,\.]+$/g, '').trim()} / {(selectedEcosystem()?.tokens.ui_secondary?.$value || '').replace(/^Token[^\:]*\:\s*/i, '').replace(/[\s\—\-\:\;\,\.]+$/g, '').trim()}
                </span>
              </Show>

              <button 
                onClick={() => setCurrentStep(2)}
                class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1 rounded shadow transition cursor-pointer"
              >
                Pasar a Símbolo ➔
              </button>
            </div>
          </div>

          <Show when={showEcosystemsSection()}>
            <div class="p-3 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3">
              <For each={ecosystems()}>
                {(eco) => {
                  const cleanLabel = (s?: string) => (s || '').replace(/^Token[^\:]*\:\s*/i, '').replace(/[\s\—\-\:\;\,\.]+$/g, '').trim();
                  const displayClean = () => cleanLabel(eco.tokens.display_primary?.$value);
                  const uiClean = () => cleanLabel(eco.tokens.ui_secondary?.$value);
                  const accentClean = () => cleanLabel(eco.tokens.accent_brand?.$value);

                  return (
                    <div class="p-3 rounded-xl border bg-gray-950 border-gray-800 text-xs flex flex-col justify-between gap-2.5 shadow-md">
                      <div>
                        <div class="font-bold text-white text-xs mb-0.5">{eco.name}</div>
                        <p class="text-[10px] text-gray-400 line-clamp-2 mb-2">{eco.archetype}</p>
                        
                        {/* Tokens con Enlaces de Descarga Directos en el Nombre SIN guiones residuales (Punto 2.a y 2.b) */}
                        <div class="bg-gray-900/95 p-2 rounded border border-gray-800 text-[11px] font-mono flex flex-col gap-1.5 text-emerald-300">
                          <div class="flex items-center gap-1.5">
                            <span class="text-gray-400 font-semibold">Display:</span>
                            <Show when={eco.tokens.display_primary?.url} fallback={<strong class="text-white">{displayClean()}</strong>}>
                              <a 
                                href={eco.tokens.display_primary.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                class="text-emerald-400 hover:text-emerald-300 font-bold underline transition"
                                title="Descargar / Ver espécimen"
                              >
                                {displayClean()}
                              </a>
                            </Show>
                          </div>
                          <div class="flex items-center gap-1.5">
                            <span class="text-gray-400 font-semibold">UI:</span>
                            <Show when={eco.tokens.ui_secondary?.url} fallback={<strong class="text-white">{uiClean()}</strong>}>
                              <a 
                                href={eco.tokens.ui_secondary.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                class="text-emerald-400 hover:text-emerald-300 font-bold underline transition"
                                title="Descargar / Ver espécimen"
                              >
                                {uiClean()}
                              </a>
                            </Show>
                          </div>
                          <div class="flex items-center gap-1.5">
                            <span class="text-gray-400 font-semibold">Acento:</span>
                            <Show when={eco.tokens.accent_brand?.url} fallback={<strong class="text-white">{accentClean()}</strong>}>
                              <a 
                                href={eco.tokens.accent_brand.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                class="text-emerald-400 hover:text-emerald-300 font-bold underline transition"
                                title="Descargar / Ver espécimen"
                              >
                                {accentClean()}
                              </a>
                            </Show>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => addCanvasFromEcosystem(eco)}
                        class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-1.5 rounded text-[11px] transition shadow cursor-pointer flex items-center justify-center gap-1"
                      >
                        <span>+ Cargar al Lienzo con 6 Capas</span>
                      </button>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>
        </section>

        {/* Sub-Header: Textos de Marca & Selector de Fuentes Envato */}
        <div class="bg-gray-900/90 border-b border-gray-800 px-4 py-2 flex items-center justify-between gap-3 flex-wrap text-xs">
          <div class="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
            <span class="text-gray-400 text-[11px]">Textos de Marca:</span>
            <input 
              type="text" value={brandInitials()} onInput={(e) => setBrandInitials(e.currentTarget.value)}
              placeholder="Iniciales" class="bg-gray-950 border border-gray-700 rounded px-2.5 py-1 text-white w-16 text-center font-bold"
            />
            <input 
              type="text" value={brandDisplayName()} onInput={(e) => setBrandDisplayName(e.currentTarget.value)}
              placeholder="Nombre Marca" class="bg-gray-950 border border-gray-700 rounded px-2.5 py-1 text-white w-44 font-semibold"
            />
            <input 
              type="text" value={brandSlogan()} onInput={(e) => setBrandSlogan(e.currentTarget.value)}
              placeholder="Slogan" class="bg-gray-950 border border-gray-700 rounded px-2.5 py-1 text-white w-56 text-gray-300"
            />
          </div>

          <div class="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {/* Botón de Extracción en Vivo de Fuentes Envato */}
            <button 
              onClick={handleExtractFonts}
              disabled={isExtracting()}
              class="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded text-xs border border-gray-700 transition cursor-pointer flex items-center gap-1"
              title="Extrae automáticamente nuevos archivos ZIP colocados en /FUENTES/ENVATO"
            >
              <span>🔄 {isExtracting() ? 'Extrayendo...' : 'Actualizar Fuentes ZIP'}</span>
              {extractMsg() && <span class="text-emerald-400 font-bold">({extractMsg()})</span>}
            </button>

            {/* Selector de Fuentes Envato */}
            <select 
              onChange={(e) => {
                if (e.currentTarget.value) {
                  addCanvas(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              class="bg-gray-950 border border-gray-700 text-gray-300 rounded px-2.5 py-1 text-xs cursor-pointer"
            >
              <option value="">+ Probar Fuente Envato...</option>
              <For each={envatoFonts()}>
                {(f) => <option value={f}>{f}</option>}
              </For>
            </select>

            <button 
              onClick={() => addCanvas('Plus Jakarta Sans')}
              class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded text-xs transition shadow cursor-pointer"
            >
              + Nuevo Lienzo en Blanco
            </button>
          </div>
        </div>
      </Show>

      {/* Grid de Lienzos Reactivos con Ancho Completo */}
      <main class={`flex-1 p-4 overflow-y-auto grid ${
        cards().length === 0 ? 'grid-cols-1' : gridCols() === 1 ? 'grid-cols-1' : gridCols() === 2 ? 'grid-cols-2' : 'grid-cols-3'
      } gap-4 content-start w-full relative`}>
        
        {/* Placeholder si inicia sin lienzos */}
        <Show when={cards().length === 0}>
          <div class="col-span-full h-96 flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-2xl bg-gray-900/40 text-center p-8">
            <div class="text-3xl mb-2">🎨</div>
            <h3 class="text-base font-bold text-white mb-1">Lienzo de Trabajo Limpio</h3>
            <p class="text-xs text-gray-400 max-w-md mb-4">
              Selecciona uno de los ecosistemas superiores para cargarlo al lienzo o añade un lienzo en blanco para comenzar a diseñar y manipular la tipografía.
            </p>
            <div class="flex gap-3">
              <button 
                onClick={() => addCanvasFromEcosystem(ecosystems()[0])}
                class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg shadow cursor-pointer"
              >
                Cargar Ecosistema Sugerido
              </button>
              <button 
                onClick={() => addCanvas('Plus Jakarta Sans')}
                class="bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs px-4 py-2 rounded-lg border border-gray-700 cursor-pointer"
              >
                + Lienzo en Blanco
              </button>
            </div>
          </div>
        </Show>

        <For each={cards()}>
          {(card) => {
            const initialsStyle = () => getNodeStyle(card.id, 'initials', card.fontFamily, 76);
            const brandStyle = () => getNodeStyle(card.id, 'brand', card.fontFamily, 36);
            const sloganStyle = () => getNodeStyle(card.id, 'slogan', card.fontFamily, 14);
            const h1Style = () => getNodeStyle(card.id, 'h1', card.fontFamily, 28, 'left');
            const h2Style = () => getNodeStyle(card.id, 'h2', card.fontFamily, 15, 'left');
            const bodyStyle = () => getNodeStyle(card.id, 'body', card.fontFamily, 13, 'justify');

            return (
              <div 
                onClick={(e) => e.stopPropagation()}
                class={`group relative rounded-xl border flex flex-col overflow-hidden shadow-2xl transition duration-150 h-[580px] w-full ${
                  card.fullscreen ? 'fullscreen-active bg-gray-900 border-emerald-500 z-50' : ''
                } ${
                  card.isDefinitive ? 'ring-2 ring-emerald-500' : ''
                } ${
                  card.theme === 'dark' 
                    ? 'bg-gray-900 border-gray-700 text-gray-100'
                    : 'bg-slate-100 border-gray-300 text-slate-800'
                }`}
              >
                {/* Barra Superior Hover UI */}
                <div class="absolute top-0 inset-x-0 p-2 bg-gray-950/95 backdrop-blur z-20 flex items-center justify-between opacity-0 group-hover:opacity-100 transition border-b border-gray-800 text-xs">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-white px-1 truncate max-w-[110px]">{card.fontFamily}</span>
                    
                    {/* Botón para marcar este lienzo editado como el Definitivo */}
                    <button 
                      onClick={() => markAsDefinitive(card)}
                      class={`px-2 py-0.5 rounded text-[10px] font-black uppercase transition cursor-pointer ${
                        card.isDefinitive 
                          ? 'bg-emerald-500 text-black shadow' 
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                      }`}
                    >
                      {card.isDefinitive ? '✓ DEFINITIVO' : 'Marcar Definitivo'}
                    </button>
                  </div>
                  
                  {/* Selector de Modo Centrado: Letra / Palabra / Bloque (Punto 3.c) */}
                  <div class="flex items-center gap-1 bg-gray-900 px-2 py-0.5 rounded border border-gray-700 shadow-inner">
                    <span class="text-[10px] text-gray-400">Modo:</span>
                    <select 
                      value={card.mode}
                      onChange={(e) => setCardMode(card.id, e.currentTarget.value as any)}
                      class="bg-gray-800 text-emerald-300 font-bold border-none rounded text-xs px-1.5 py-0.5 cursor-pointer focus:outline-none"
                    >
                      <option value="bloque">Bloque</option>
                      <option value="palabra">Palabra</option>
                      <option value="letra">Letra</option>
                    </select>
                  </div>

                  <div class="flex items-center gap-1">
                    <button 
                      onClick={() => toggleColumn(card.id, 'left')}
                      class="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-[11px]"
                      title="Alternar Columna Izquierda"
                    >Izq</button>
                    <button 
                      onClick={() => toggleColumn(card.id, 'right')}
                      class="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-[11px]"
                      title="Alternar Columna Derecha"
                    >Der</button>

                    {/* Slider de Zoom fluido con mouse oprimido (Punto 3.a) */}
                    <div 
                      class="flex items-center gap-1 bg-gray-800 px-2 py-0.5 rounded"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <span class="text-[10px] text-gray-400">Zoom</span>
                      <input 
                        type="range" min="0.2" max="2.5" step="0.05" value={card.zoom}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onInput={(e) => setCardZoom(card.id, parseFloat(e.currentTarget.value))}
                        onChange={(e) => setCardZoom(card.id, parseFloat(e.currentTarget.value))}
                        class="w-16 h-1.5 accent-emerald-500 cursor-pointer"
                      />
                      <button onClick={() => setCardZoom(card.id, 1)} class="text-gray-400 hover:text-white text-[10px]" title="Reset Zoom">↺</button>
                    </div>

                    <button 
                      onClick={() => resetCardPositions(card.id)}
                      class="bg-gray-800 hover:bg-gray-700 text-emerald-300 font-bold px-2 py-0.5 rounded text-[11px] transition cursor-pointer"
                      title="Restablecer Lienzo General: Elimina modificaciones subordinadas de palabras/letras y restaura las fuentes y estilos iniciales del ecosistema"
                    >↺ Reset</button>
                    <button 
                      onClick={() => toggleTheme(card.id)}
                      class="bg-gray-800 hover:bg-gray-700 text-white px-2 py-0.5 rounded text-[11px]"
                      title="Cambiar Modo Claro/Oscuro"
                    >🌓</button>
                    <button 
                      onClick={() => toggleFullscreen(card.id)}
                      class="bg-gray-800 hover:bg-gray-700 text-white px-2 py-0.5 rounded text-[11px]"
                      title="Pantalla Completa"
                    >⛶</button>
                    
                    {/* Ocultar botón cerrar en modo fullscreen de tarjeta (Punto 3.b) */}
                    <Show when={!card.fullscreen}>
                      <button 
                        onClick={() => removeCanvas(card.id)}
                        class="bg-red-950 hover:bg-red-800 text-red-200 px-2 py-0.5 rounded text-[11px] font-bold"
                        title="Eliminar este lienzo"
                      >✕</button>
                    </Show>
                  </div>
                </div>

                {/* Contenido Split Screen SIN línea divisoria vertical (Punto 3.d) */}
                <div 
                  style={{ transform: `scale(${card.zoom})`, 'transform-origin': 'center center' }}
                  class="flex-1 flex w-full h-full transition-transform"
                >
                  {/* Columna Izquierda (Branding & Logo) */}
                  <Show when={card.showLeft}>
                    <div class={`h-full flex flex-col items-center justify-center p-6 gap-5 transition-all ${
                      card.showRight ? 'w-1/2' : 'w-full'
                    }`}>
                      
                      {/* Iniciales Monograma */}
                      <div 
                        onMouseDown={(e) => handleMouseDown(e, card.id, 'initials', card.zoom)}
                        onClick={() => {
                          if (!wasDragged) selectElement(card.id, 'initials', brandInitials(), initialsStyle().fontFamily || card.fontFamily, initialsStyle().fontSize);
                        }}
                        class={`text-block-draggable w-full block rounded p-2 transition cursor-grab active:cursor-grabbing ${
                          isSelected(card.id, 'initials') ? 'outline-dashed outline-2 outline-emerald-500 bg-emerald-500/10' : 'hover:outline-dashed hover:outline-1 hover:outline-gray-400/60'
                        }`}
                        style={{
                          'font-family': `"${initialsStyle().fontFamily || card.fontFamily}", serif`,
                          'font-size': `${initialsStyle().fontSize}px`,
                          'letter-spacing': `${initialsStyle().letterSpacing}em`,
                          'line-height': initialsStyle().lineHeight,
                          'text-transform': initialsStyle().textTransform,
                          'font-weight': initialsStyle().fontWeight,
                          'font-style': initialsStyle().fontStyle,
                          'text-align': initialsStyle().textAlign,
                          'transform': `translate(${initialsStyle().translateX}px, ${initialsStyle().translateY}px) rotate(${initialsStyle().rotation}deg) scaleX(${initialsStyle().mirror ? -1 : 1})`
                        }}
                      >
                        {renderInteractiveContent(brandInitials(), card, 'initials', initialsStyle().fontFamily || card.fontFamily, initialsStyle().fontSize)}
                      </div>

                      {/* Nombre de Marca */}
                      <div 
                        onMouseDown={(e) => handleMouseDown(e, card.id, 'brand', card.zoom)}
                        onClick={() => {
                          if (!wasDragged) selectElement(card.id, 'brand', brandDisplayName(), brandStyle().fontFamily || card.fontFamily, brandStyle().fontSize);
                        }}
                        class={`text-block-draggable w-full block rounded p-2 transition cursor-grab active:cursor-grabbing ${
                          isSelected(card.id, 'brand') ? 'outline-dashed outline-2 outline-emerald-500 bg-emerald-500/10' : 'hover:outline-dashed hover:outline-1 hover:outline-gray-400/60'
                        }`}
                        style={{
                          'font-family': `"${brandStyle().fontFamily || card.fontFamily}", sans-serif`,
                          'font-size': `${brandStyle().fontSize}px`,
                          'letter-spacing': `${brandStyle().letterSpacing}em`,
                          'line-height': brandStyle().lineHeight,
                          'text-transform': brandStyle().textTransform,
                          'font-weight': brandStyle().fontWeight,
                          'font-style': brandStyle().fontStyle,
                          'text-align': brandStyle().textAlign,
                          'transform': `translate(${brandStyle().translateX}px, ${brandStyle().translateY}px) rotate(${brandStyle().rotation}deg) scaleX(${brandStyle().mirror ? -1 : 1})`
                        }}
                      >
                        {renderInteractiveContent(brandDisplayName(), card, 'brand', brandStyle().fontFamily || card.fontFamily, brandStyle().fontSize)}
                      </div>

                      {/* Slogan */}
                      <div 
                        onMouseDown={(e) => handleMouseDown(e, card.id, 'slogan', card.zoom)}
                        onClick={() => {
                          if (!wasDragged) selectElement(card.id, 'slogan', brandSlogan(), sloganStyle().fontFamily || card.fontFamily, sloganStyle().fontSize);
                        }}
                        class={`text-block-draggable w-full block rounded p-1 transition cursor-grab active:cursor-grabbing ${
                          isSelected(card.id, 'slogan') ? 'outline-dashed outline-2 outline-emerald-500 bg-emerald-500/10' : 'hover:outline-dashed hover:outline-1 hover:outline-gray-400/60'
                        }`}
                        style={{
                          'font-family': `"${sloganStyle().fontFamily || card.fontFamily}", sans-serif`,
                          'font-size': `${sloganStyle().fontSize}px`,
                          'letter-spacing': `${sloganStyle().letterSpacing}em`,
                          'line-height': sloganStyle().lineHeight,
                          'text-transform': sloganStyle().textTransform,
                          'font-weight': sloganStyle().fontWeight,
                          'font-style': sloganStyle().fontStyle,
                          'text-align': sloganStyle().textAlign,
                          'transform': `translate(${sloganStyle().translateX}px, ${sloganStyle().translateY}px) rotate(${sloganStyle().rotation}deg) scaleX(${sloganStyle().mirror ? -1 : 1})`
                        }}
                      >
                        {renderInteractiveContent(brandSlogan(), card, 'slogan', sloganStyle().fontFamily || card.fontFamily, sloganStyle().fontSize)}
                      </div>
                    </div>
                  </Show>

                  {/* Columna Derecha (Editorial & Párrafos) */}
                  <Show when={card.showRight}>
                    <div class={`h-full flex flex-col justify-center p-8 gap-4 transition-all ${
                      card.showLeft ? 'w-1/2' : 'w-full'
                    }`}>
                      <h2 
                        onMouseDown={(e) => handleMouseDown(e, card.id, 'h1', card.zoom)}
                        onClick={() => {
                          if (!wasDragged) selectElement(card.id, 'h1', 'El futuro del diseño...', h1Style().fontFamily || card.fontFamily, h1Style().fontSize, 'left');
                        }}
                        class={`text-block-draggable w-full block rounded p-1 transition cursor-grab active:cursor-grabbing ${
                          isSelected(card.id, 'h1') ? 'outline-dashed outline-2 outline-emerald-500 bg-emerald-500/10' : 'hover:outline-dashed hover:outline-1 hover:outline-gray-400/60'
                        }`}
                        style={{
                          'font-family': `"${h1Style().fontFamily || card.fontFamily}", serif`,
                          'font-size': `${h1Style().fontSize}px`,
                          'letter-spacing': `${h1Style().letterSpacing}em`,
                          'line-height': h1Style().lineHeight,
                          'text-transform': h1Style().textTransform,
                          'font-weight': h1Style().fontWeight,
                          'font-style': h1Style().fontStyle,
                          'text-align': h1Style().textAlign,
                          'transform': `translate(${h1Style().translateX}px, ${h1Style().translateY}px) rotate(${h1Style().rotation}deg) scaleX(${h1Style().mirror ? -1 : 1})`
                        }}
                      >
                        {renderInteractiveContent('El futuro del diseño es tipográfico.', card, 'h1', h1Style().fontFamily || card.fontFamily, h1Style().fontSize, 'left')}
                      </h2>
                      <h3 
                        onMouseDown={(e) => handleMouseDown(e, card.id, 'h2', card.zoom)}
                        onClick={() => {
                          if (!wasDragged) selectElement(card.id, 'h2', 'Explorando jerarquías...', h2Style().fontFamily || card.fontFamily, h2Style().fontSize, 'left');
                        }}
                        class={`text-block-draggable w-full block rounded p-1 transition opacity-90 cursor-grab active:cursor-grabbing ${
                          isSelected(card.id, 'h2') ? 'outline-dashed outline-2 outline-emerald-500 bg-emerald-500/10' : 'hover:outline-dashed hover:outline-1 hover:outline-gray-400/60'
                        }`}
                        style={{
                          'font-family': `"${h2Style().fontFamily || card.fontFamily}", sans-serif`,
                          'font-size': `${h2Style().fontSize}px`,
                          'letter-spacing': `${h2Style().letterSpacing}em`,
                          'line-height': h2Style().lineHeight,
                          'text-transform': h2Style().textTransform,
                          'font-weight': h2Style().fontWeight,
                          'font-style': h2Style().fontStyle,
                          'text-align': h2Style().textAlign,
                          'transform': `translate(${h2Style().translateX}px, ${h2Style().translateY}px) rotate(${h2Style().rotation}deg) scaleX(${h2Style().mirror ? -1 : 1})`
                        }}
                      >
                        {renderInteractiveContent('Explorando jerarquías, proporciones y accesibilidad perceptual.', card, 'h2', h2Style().fontFamily || card.fontFamily, h2Style().fontSize, 'left')}
                      </h3>
                      <p 
                        onMouseDown={(e) => handleMouseDown(e, card.id, 'body', card.zoom)}
                        onClick={() => {
                          if (!wasDragged) selectElement(card.id, 'body', 'Párrafo editorial...', bodyStyle().fontFamily || card.fontFamily, bodyStyle().fontSize, 'justify');
                        }}
                        class={`text-block-draggable w-full block rounded p-1 transition opacity-80 cursor-grab active:cursor-grabbing ${
                          isSelected(card.id, 'body') ? 'outline-dashed outline-2 outline-emerald-500 bg-emerald-500/10' : 'hover:outline-dashed hover:outline-1 hover:outline-gray-400/60'
                        }`}
                        style={{
                          'font-family': `"${bodyStyle().fontFamily || card.fontFamily}", sans-serif`,
                          'font-size': `${bodyStyle().fontSize}px`,
                          'letter-spacing': `${bodyStyle().letterSpacing}em`,
                          'line-height': bodyStyle().lineHeight,
                          'text-transform': bodyStyle().textTransform,
                          'font-weight': bodyStyle().fontWeight,
                          'font-style': bodyStyle().fontStyle,
                          'text-align': bodyStyle().textAlign,
                          'transform': `translate(${bodyStyle().translateX}px, ${bodyStyle().translateY}px) rotate(${bodyStyle().rotation}deg) scaleX(${bodyStyle().mirror ? -1 : 1})`
                        }}
                      >
                        {renderInteractiveContent('La tipografía es el arte y la técnica de organizar los tipos para que el lenguaje escrito sea legible, memorable y estéticamente irreprochable.', card, 'body', bodyStyle().fontFamily || card.fontFamily, bodyStyle().fontSize, 'justify')}
                      </p>
                    </div>
                  </Show>
                </div>
              </div>
            );
          }}
        </For>
      </main>
    </div>
  );
};
