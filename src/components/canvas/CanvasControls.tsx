interface CanvasControlsProps {
    zoom: number;
    addNodeMode: boolean;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onFitToScreen: () => void;
    onToggleAddNode: () => void;
}

export default function CanvasControls({
    zoom,
    addNodeMode,
    onZoomIn,
    onZoomOut,
    onFitToScreen,
    onToggleAddNode,
}: CanvasControlsProps) {
    return (
        <div className="canvas-controls">
            <button
                className={`canvas-btn ${addNodeMode ? 'active-mode' : ''}`}
                onClick={onToggleAddNode}
                title="Add Node (N)"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            </button>
            <div className="h-1" />
            <button className="canvas-btn" onClick={onZoomIn} title="Zoom In">
                +
            </button>
            <div className="flex items-center justify-center text-[10px] text-gray-400 font-medium py-0.5">
                {Math.round(zoom * 100)}%
            </div>
            <button className="canvas-btn" onClick={onZoomOut} title="Zoom Out">
                −
            </button>
            <div className="h-1" />
            <button className="canvas-btn" onClick={onFitToScreen} title="Fit to Screen">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
                </svg>
            </button>
        </div>
    );
}
