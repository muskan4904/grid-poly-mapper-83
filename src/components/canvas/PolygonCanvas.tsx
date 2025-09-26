import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Canvas as FabricCanvas, Polygon, Polyline, Circle, Line, FabricImage, Rect, Text, Group } from 'fabric';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Eye, Download, FileText, Undo2, Redo2 } from 'lucide-react';
import { DirectionChartDialog } from '@/components/ui/direction-chart';
import { DevtaNamesDialog } from '@/components/ui/devta-names-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  calculatePolygonArea, 
  calculatePolygonCenter,
  isPointInPolygon,
  createCentral12DevtaGrid
} from '@/utils/polygonUtils';

interface Point {
  x: number;
  y: number;
}

interface PolygonCanvasProps {
  imageUrl?: string;
  onPolygonChange?: (polygon: Point[], area: number, center: Point) => void;
  className?: string;
}

export const PolygonCanvas: React.FC<PolygonCanvasProps> = ({
  imageUrl,
  onPolygonChange,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);
  const [currentPolygon, setCurrentPolygon] = useState<Polygon | Polyline | Circle | null>(null);
  const [centerPoint, setCenterPoint] = useState<Circle | null>(null);
  const [smallPolygon, setSmallPolygon] = useState<Polygon | null>(null);
  const [mediumPolygon, setMediumPolygon] = useState<Polygon | null>(null);
  const [gridLines, setGridLines] = useState<any[]>([]);
  const [devtaZones, setDevtaZones] = useState<any[]>([]);
  const [showDevtas, setShowDevtas] = useState(true);
  const [show16Directions, setShow16Directions] = useState(false);
  const [show32Gates, setShow32Gates] = useState(false);
  const [show16BarChart, setShow16BarChart] = useState(false);
  const [showDevtaNamesDialog, setShowDevtaNamesDialog] = useState(false);
  const [showVithiMandal, setShowVithiMandal] = useState(false);
  const [rotationDegree, setRotationDegree] = useState(0);
  const [directionLines, setDirectionLines] = useState<any[]>([]);
  const [gateLines, setGateLines] = useState<any[]>([]);
  const [completedPolygonPoints, setCompletedPolygonPoints] = useState<Point[]>([]);
  const [isRotating, setIsRotating] = useState(false);
  const [show45Devtas, setShow45Devtas] = useState(false);
  const [devtaSlices, setDevtaSlices] = useState<any[]>([]);
  const [vithiMandalPolygons, setVithiMandalPolygons] = useState<any[]>([]);
  const [show32Entrances, setShow32Entrances] = useState(false);
  const [entranceLines, setEntranceLines] = useState<any[]>([]);
  const [showMarmaSthan, setShowMarmaSthan] = useState(false);
  const [marmaSthanLines, setMarmaSthanLines] = useState<Line[]>([]);
  const [showPDFDialog, setShowPDFDialog] = useState(false);
  const [pdfUserDetails, setPdfUserDetails] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [showTest, setShowTest] = useState(false);
  const [testPolygon, setTestPolygon] = useState<Polygon | null>(null);
  const [testMediumPolygon, setTestMediumPolygon] = useState<Polygon | null>(null);
  const [testGridLines, setTestGridLines] = useState<any[]>([]);
  
  // Undo/Redo functionality for polygon drawing
  const [polygonHistory, setPolygonHistory] = useState<Point[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  

  // Initialize canvas with responsive dimensions
  useEffect(() => {
    if (!canvasRef.current) return;

    // Calculate responsive canvas dimensions - much larger for full screen coverage
    const container = canvasRef.current.parentElement;
    const containerWidth = container ? container.clientWidth : window.innerWidth - 32;
    
    // Much larger canvas dimensions for better visibility
    const isMobile = window.innerWidth < 1024;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate canvas size based on viewport - aim for ~80% of screen
    let canvasWidth, canvasHeight;
    
    if (isMobile) {
      // Mobile: Maximum coverage - 85% of screen height
      canvasWidth = Math.min(containerWidth - 4, viewportWidth - 8);
      canvasHeight = Math.min(viewportHeight * 0.85, canvasWidth * 1.2); // 85% of viewport height
    } else {
      // Desktop: Large canvas with better coverage
      canvasWidth = Math.min(containerWidth - 16, viewportWidth * 0.8); // 80% of viewport width
      canvasHeight = Math.min(canvasWidth * 0.75, viewportHeight * 0.85); // 85% of viewport height
    }
    
    // Ensure good minimum sizes
    canvasWidth = Math.max(canvasWidth, 300);
    canvasHeight = Math.max(canvasHeight, 250);

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: '#ffffff',
      selection: false
    });

    setFabricCanvas(canvas);

    // Handle window resize
    const handleResize = () => {
      const newContainerWidth = container ? container.clientWidth : window.innerWidth - 32;
      const newIsMobile = window.innerWidth < 1024;
      const newViewportWidth = window.innerWidth;
      const newViewportHeight = window.innerHeight;
      
      let newCanvasWidth, newCanvasHeight;
      
      if (newIsMobile) {
        newCanvasWidth = Math.min(newContainerWidth - 4, newViewportWidth - 8);
        newCanvasHeight = Math.min(newViewportHeight * 0.85, newCanvasWidth * 1.2);
      } else {
        newCanvasWidth = Math.min(newContainerWidth - 16, newViewportWidth * 0.8);
        newCanvasHeight = Math.min(newCanvasWidth * 0.75, newViewportHeight * 0.85);
      }
      
      newCanvasWidth = Math.max(newCanvasWidth, 300);
      newCanvasHeight = Math.max(newCanvasHeight, 250);
      
      canvas.setDimensions({
        width: newCanvasWidth,
        height: newCanvasHeight
      });
      canvas.renderAll();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  // Load image when provided
  useEffect(() => {
    if (!fabricCanvas || !imageUrl) return;

    fabricCanvas.clear();
    setPolygonPoints([]);
    setCurrentPolygon(null);
    setCenterPoint(null);
    setSmallPolygon(null);
    setMediumPolygon(null);
    setGridLines([]);
    setDevtaZones([]);
    setDirectionLines([]);
    setGateLines([]);
    setCompletedPolygonPoints([]);

    // Load and add image as Fabric object
    const imgElement = new Image();
    imgElement.crossOrigin = 'anonymous';
    imgElement.onload = () => {
      console.log("Image loaded successfully:", imgElement.width, "x", imgElement.height);
      const canvasWidth = fabricCanvas.width || 800;
      const canvasHeight = fabricCanvas.height || 600;
      
      const imgAspectRatio = imgElement.width / imgElement.height;
      const canvasAspectRatio = canvasWidth / canvasHeight;
      
      let renderWidth, renderHeight;
      
      if (imgAspectRatio > canvasAspectRatio) {
        renderWidth = canvasWidth;
        renderHeight = canvasWidth / imgAspectRatio;
      } else {
        renderHeight = canvasHeight;
        renderWidth = canvasHeight * imgAspectRatio;
      }
      
      const left = (canvasWidth - renderWidth) / 2;
      const top = (canvasHeight - renderHeight) / 2;

      console.log("Image render dimensions:", { renderWidth, renderHeight, left, top });

      // Create Fabric image object
      const fabricImg = new FabricImage(imgElement, {
        left: left,
        top: top,
        scaleX: renderWidth / imgElement.width,
        scaleY: renderHeight / imgElement.height,
        selectable: false,
        evented: false
      });

      fabricCanvas.add(fabricImg);
      fabricCanvas.sendObjectToBack(fabricImg);
      
      // Ensure all existing objects remain on top of the image
      const allObjects = fabricCanvas.getObjects();
      allObjects.forEach((obj, index) => {
        if (obj !== fabricImg) {
          fabricCanvas.bringObjectToFront(obj);
        }
      });
      
      fabricCanvas.renderAll();
      console.log("Canvas objects after image load:", fabricCanvas.getObjects().length);
      toast.success("House map loaded successfully!");
    };
    imgElement.src = imageUrl;
  }, [fabricCanvas, imageUrl]);

  // Canvas click handler for polygon drawing
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleCanvasClick = (e: any) => {
      if (!isDrawing) return;

      const pointer = fabricCanvas.getPointer(e.e);
      const newPoint = { x: pointer.x, y: pointer.y };
      
      setPolygonPoints(prev => {
        const updatedPoints = [...prev, newPoint];
        const pointNumber = updatedPoints.length;
        
        // Add numbered point marker at the clicked location
        const circle = new Circle({
          radius: 10,
          fill: '#2563eb',
          stroke: '#ffffff',
          strokeWidth: 2,
          left: pointer.x - 10,
          top: pointer.y - 10,
          selectable: false,
          evented: false,
        });

        const text = new Text(pointNumber.toString(), {
          left: pointer.x - 4.5,
          top: pointer.y - 7,
          fontSize: 14,
          fill: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
          selectable: false,
          evented: false,
        });

        fabricCanvas.add(circle);
        fabricCanvas.add(text);
        
        // Draw temporary polygon with proper point connections
        drawTemporaryPolygon(updatedPoints);
        
        // Update polygon history for undo/redo
        setPolygonHistory(prevHistory => {
          const newHistory = prevHistory.slice(0, historyIndex + 1);
          newHistory.push(updatedPoints);
          return newHistory;
        });
        setHistoryIndex(prevIndex => prevIndex + 1);
        
        return updatedPoints;
      });
    };

    fabricCanvas.on('mouse:down', handleCanvasClick);

    return () => {
      fabricCanvas.off('mouse:down', handleCanvasClick);
    };
  }, [fabricCanvas, isDrawing]);

  const drawTemporaryPolygon = (points: Point[]) => {
    if (!fabricCanvas) return;

    // Remove previous temporary polygon
    if (currentPolygon) {
      fabricCanvas.remove(currentPolygon);
    }

    // Show lines even with just 1 point (for visual feedback)
    if (points.length >= 1) {
      const fabricPoints = points.map(p => ({ x: p.x, y: p.y }));
      
      if (points.length === 1) {
        // For single point, create a small circle to show the starting point
        const startPoint = new Circle({
          radius: 3,
          fill: '#2563eb',
          left: points[0].x - 3,
          top: points[0].y - 3,
          selectable: false,
          evented: false,
          opacity: 0.7
        });
        fabricCanvas.add(startPoint);
        setCurrentPolygon(startPoint);
      } else {
        // For multiple points, draw the polyline with thicker blue stroke
        const polyline = new Polyline(fabricPoints, {
          fill: '',
          stroke: '#2563eb',
          strokeWidth: 4,
          selectable: false,
          evented: false
        });
        fabricCanvas.add(polyline);
        setCurrentPolygon(polyline);
      }
    }

    fabricCanvas.renderAll();
  };

  const completePolygon = (points: Point[]) => {
    if (!fabricCanvas || points.length < 3) {
      toast.error("Polygon needs at least 3 points!");
      return;
    }

    // Calculate area and center
    const area = calculatePolygonAreaLocal(points);
    const center = calculatePolygonCenterLocal(points);

    // Draw final polygon
    const fabricPoints = points.map(p => ({ x: p.x, y: p.y }));
    const finalPolygon = new Polygon(fabricPoints, {
      fill: 'rgba(37, 99, 235, 0.2)',
      stroke: '#2563eb',
      strokeWidth: 4,
      selectable: false,
      evented: false
    });

    // Remove temporary polygon
    if (currentPolygon) {
      fabricCanvas.remove(currentPolygon);
    }

    fabricCanvas.add(finalPolygon);
    console.log("Final polygon added to canvas. Total objects:", fabricCanvas.getObjects().length);
    setCurrentPolygon(finalPolygon);

    // Draw center point
    const centerCircle = new Circle({
      left: center.x - 5,
      top: center.y - 5,
      radius: 5,
      fill: 'hsl(0, 84%, 60%)',
      stroke: 'white',
      strokeWidth: 2,
      selectable: false,
      evented: false
    });

    if (centerPoint) {
      fabricCanvas.remove(centerPoint);
    }
    fabricCanvas.add(centerCircle);
    setCenterPoint(centerCircle);

    // Draw smaller polygon with much smaller area for more spacing
    if (showDevtas) {
      drawSmallPolygon(points, center);
    }
    
    // Draw medium polygon with 62% area
    if (showDevtas) {
      drawMediumPolygon(points, center);
    }

    // Removed radial lines extension

    // Divide ring area into 32 equal-angle slices
    if (showDevtas) {
      drawRingSlices(points, center);
    }

    // Draw 16 directions if enabled
    if (show16Directions) {
      draw16Directions(points, center);
    }

    // Draw 32 gates if enabled
    if (show32Gates) {
      draw32Gates(points, center);
    }


    // Draw 32 entrances if enabled
    if (show32Entrances) {
      draw32Entrances(points, center);
    }

    // Draw Marma Sthan if enabled
    if (showMarmaSthan) {
      drawMarmaSthan(points, center);
    }

    // Draw Test feature if enabled
    if (showTest) {
      drawTestMediumPolygon(points, center);
      drawTestRingSlices(points, center);
    }

    fabricCanvas.renderAll();
    console.log("Polygon completed. Canvas objects:", fabricCanvas.getObjects().length, "Show features:", { show45Devtas, show16Directions, show32Gates, showVithiMandal, showMarmaSthan, showTest });
    setIsDrawing(false);
    setPolygonPoints([]);
    setCompletedPolygonPoints(points); // Store completed polygon points

    onPolygonChange?.(points, area, center);
    toast.success(`Polygon completed! Area: ${area.toFixed(2)} sq units`);
  };

  const calculatePolygonAreaLocal = (points: Point[]): number => {
    return calculatePolygonArea(points);
  };

  const calculatePolygonCenterLocal = (points: Point[]): Point => {
    return calculatePolygonCenter(points);
  };

  const drawSmallPolygon = (polygonPoints: Point[], center: Point) => {
    if (!fabricCanvas) return;

    // Remove existing small polygon
    if (smallPolygon) {
      fabricCanvas.remove(smallPolygon);
      setSmallPolygon(null);
    }

    // Calculate scale factor for 11% area (√0.11 ≈ 0.331)
    const areaScaleFactor = 0.11;
    const linearScaleFactor = Math.sqrt(areaScaleFactor);

    console.log('Creating small polygon with scale factor:', linearScaleFactor);
    console.log('Original polygon center:', center);
    console.log('Original polygon points:', polygonPoints);

    // Scale polygon points around the center
    const scaledPoints = polygonPoints.map(point => {
      // Translate to origin (center)
      const translatedX = point.x - center.x;
      const translatedY = point.y - center.y;
      
      // Scale
      const scaledX = translatedX * linearScaleFactor;
      const scaledY = translatedY * linearScaleFactor;
      
      // Translate back to center position
      return {
        x: scaledX + center.x,
        y: scaledY + center.y
      };
    });

    console.log('Scaled polygon points:', scaledPoints);

    // Create smaller polygon with transparent fill and red boundary only
    const fabricPoints = scaledPoints.map(p => ({ x: p.x, y: p.y }));
    const smallPoly = new Polygon(fabricPoints, {
      fill: 'transparent', // No fill - transparent inside
      stroke: '#ff0000', // Red border only
      strokeWidth: 3,
      selectable: false,
      evented: false
    });

    // Add and ensure it's on top
    fabricCanvas.add(smallPoly);
    
    // Make sure it's rendered on top of everything except center point
    fabricCanvas.bringObjectToFront(smallPoly);
    
    setSmallPolygon(smallPoly);
    fabricCanvas.renderAll();

    const smallArea = calculatePolygonArea(scaledPoints);
    const originalArea = calculatePolygonArea(polygonPoints);
    const actualPercentage = (smallArea / originalArea) * 100;
    
    console.log('Original polygon area:', originalArea);
    console.log('Small polygon area:', smallArea);
    console.log('Actual percentage:', actualPercentage);
    
    toast.success(`Small polygon created with ${actualPercentage.toFixed(1)}% area (${smallArea.toFixed(2)} sq units)`);
  };

  // Compute closest intersection of a ray (from center at angle) with a polygon
  const getRayIntersectionWithPolygon = (center: Point, angleRad: number, polygon: Point[]): Point | null => {
    const dx = Math.cos(angleRad);
    const dy = Math.sin(angleRad);
    const EPS = 1e-9;
    let bestT = Infinity;
    let bestPoint: Point | null = null;
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % polygon.length];
      const ex = b.x - a.x;
      const ey = b.y - a.y;
      const det = dy * ex - dx * ey; // determinant of [D, -E]
      if (Math.abs(det) < EPS) continue; // parallel
      const ax = a.x - center.x;
      const ay = a.y - center.y;
      const t = (ax * (-ey) - ay * (-ex)) / det; // along the ray
      const s = (dx * ay - dy * ax) / det;       // along the segment
      if (t >= 0 && s >= -EPS && s <= 1 + EPS) {
        if (t < bestT) {
          bestT = t;
          bestPoint = { x: center.x + t * dx, y: center.y + t * dy };
        }
      }
    }
    return bestPoint;
  };


  // Create 32 ring slices between main (outer) polygon and the medium (inner) polygon  
  const drawRingSlices = useCallback((polygonPoints: Point[], center: Point) => {
    if (!fabricCanvas) return;

    // Recompute the inner (second layer) polygon using the same scale as drawMediumPolygon
    const innerScale = Math.sqrt(0.62); // ~0.787
    const innerPolygonPoints = polygonPoints.map((p) => ({
      x: center.x + (p.x - center.x) * innerScale,
      y: center.y + (p.y - center.y) * innerScale,
    }));

    // Also compute the red small polygon points for boundary intersection
    const redPolygonScale = Math.sqrt(0.11); // ~0.331 (same as drawSmallPolygon)
    const redPolygonPoints = polygonPoints.map((p) => ({
      x: center.x + (p.x - center.x) * redPolygonScale,
      y: center.y + (p.y - center.y) * redPolygonScale,
    }));

    const N = 32;
    const angleStep = (Math.PI * 2) / N;
    const ROTATION_OFFSET = -10; // System offset for directional alignment
    const DEVTA_ADJUSTMENT = 4; // +4 degrees clockwise rotation for 45 devtas
    const rotationRad = ((rotationDegree + ROTATION_OFFSET + DEVTA_ADJUSTMENT) * Math.PI) / 180;
    const northOffset = -Math.PI / 2; // 0° = North (up)
    
    const outerHits: Point[] = [];
    const innerHits: Point[] = [];

    for (let i = 0; i < N; i++) {
      const a = i * angleStep + rotationRad + northOffset;
      const ho = getRayIntersectionWithPolygon(center, a, polygonPoints);
      const hi = getRayIntersectionWithPolygon(center, a, innerPolygonPoints);
      if (!ho || !hi) continue;
      outerHits.push(ho);
      innerHits.push(hi);
    }

    // Check if existing objects need updating vs creating new ones
    const expectedObjectCount = outerHits.length * 3; // slices + lines + labels
    const hasExisting = gridLines.length >= expectedObjectCount;
    const newObjects: any[] = [];

    // Disable selection for performance while updating
    fabricCanvas.selection = false;

    for (let i = 0; i < outerHits.length; i++) {
      const j = (i + 1) % outerHits.length;
      const verts = [
        { x: innerHits[i].x, y: innerHits[i].y },
        { x: innerHits[j].x, y: innerHits[j].y },
        { x: outerHits[j].x, y: outerHits[j].y },
        { x: outerHits[i].x, y: outerHits[i].y },
      ];

      // Separator line coordinates
      let lineStartX = innerHits[i].x;
      let lineStartY = innerHits[i].y;
      let lineEndX = outerHits[i].x;
      let lineEndY = outerHits[i].y;
      
      // For specific lines (4, 7, 12, 15, 20, 23, 28, 31), extend them from red polygon boundary to outer boundary
      const specialLines = [3, 6, 11, 14, 19, 22, 27, 30]; // indices for lines 4, 7, 12, 15, 20, 23, 28, 31
      if (specialLines.includes(i)) {
        // Calculate the direction from center with rotation
        const angle = i * angleStep + rotationRad + northOffset;
        
        // Find intersection with RED polygon boundary (start point)
        const redBoundaryPoint = getRayIntersectionWithPolygon(center, angle, redPolygonPoints);
        // Find intersection with main outer polygon boundary (end point)
        const outerBoundaryPoint = getRayIntersectionWithPolygon(center, angle, polygonPoints);
        
        if (redBoundaryPoint && outerBoundaryPoint) {
          // Start from red polygon boundary, end at outer boundary
          lineStartX = redBoundaryPoint.x;
          lineStartY = redBoundaryPoint.y;
          lineEndX = outerBoundaryPoint.x;
          lineEndY = outerBoundaryPoint.y;
        }
      }

      // Label coordinates
      const sliceCenterX = (innerHits[i].x + innerHits[j].x + outerHits[i].x + outerHits[j].x) / 4;
      const sliceCenterY = (innerHits[i].y + innerHits[j].y + outerHits[i].y + outerHits[j].y) / 4;

        // Create mapping for 45 devta numbering as per user requirements
        const getDevtaNumber = (index: number) => {
          const numberMapping: { [key: number]: number } = {
            1: 38, 2: 43, 3: 44, 4: 45, 5: 14, 6: 15, 7: 16, 8: 17, 9: 18, 10: 19,
            11: 20, 12: 21, 13: 22, 14: 23, 15: 24, 16: 25, 17: 26, 18: 27, 19: 28, 20: 29,
            21: 30, 22: 31, 23: 32, 24: 33, 25: 34, 26: 35, 27: 36, 28: 37, 29: 38, 30: 39,
            31: 40, 32: 41, 33: 6, 34: 7, 35: 2, 36: 8, 37: 9, 38: 3, 39: 10, 40: 11,
            41: 4, 42: 12, 43: 13, 44: 5
          };
          return numberMapping[index] || index;
        };

        if (hasExisting) {
          // Update existing objects
          const sliceIndex = 3 * i;
          const lineIndex = 3 * i + 1;  
          const labelIndex = 3 * i + 2;

          if (gridLines[sliceIndex]) {
            (gridLines[sliceIndex] as Polygon).set({ points: verts });
          }

          if (gridLines[lineIndex]) {
            (gridLines[lineIndex] as Line).set({
              x1: lineStartX, y1: lineStartY, 
              x2: lineEndX, y2: lineEndY
            });
          }

          if (gridLines[labelIndex]) {
            (gridLines[labelIndex] as Text).set({
              left: sliceCenterX - 8,
              top: sliceCenterY - 8,
              text: String(getDevtaNumber(i + 1))
            });
          }
        } else {
        // Create new objects
        const slice = new Polygon(verts, {
          fill: 'transparent',
          stroke: '#000000',
          strokeWidth: 2,
          selectable: false,
          evented: false,
          objectCaching: false
        });
        fabricCanvas.add(slice);
        newObjects.push(slice);

        const sep = new Line(
          [lineStartX, lineStartY, lineEndX, lineEndY],
          {
            stroke: '#000000',
            strokeWidth: 2,
            selectable: false,
            evented: false,
            objectCaching: false
          }
        );
        fabricCanvas.add(sep);
        newObjects.push(sep);


        const numberLabel = new Text(String(getDevtaNumber(i + 1)), {
          left: sliceCenterX - 8,
          top: sliceCenterY - 8,
          fontSize: 16,
          fill: '#000000',
          fontFamily: 'Arial',
          fontWeight: 'bold',
          selectable: false,
          evented: false,
          textAlign: 'center',
          objectCaching: false
        });
        fabricCanvas.add(numberLabel);
        newObjects.push(numberLabel);
      }
    }

    // Update existing objects or track new ones for state
    if (!hasExisting && newObjects.length > 0) {
      setGridLines(newObjects);
    }


    // Add numbers 33-44 between red polygon and black polygon boundaries in fixed radial sectors
    // Split regions 33, 36, 38, 40 diagonally into two halves, creating 12 regions total (33-44)
    const specialLines = [3, 6, 11, 14, 19, 22, 27, 30]; // 8 lines creating base sectors
    let regionNumber = 33;
    
    // Create mapping for region numbers as per user requirements
    const getRegionNumber = (regionNum: number) => {
      const regionMapping: { [key: number]: number } = {
        33: 6, 34: 7, 35: 2, 36: 8, 37: 9, 38: 37, 39: 10, 40: 11, 41: 4, 42: 12, 43: 13, 44: 5
      };
      return regionMapping[regionNum] || regionNum;
    };
    
    // Process each sector, splitting sectors at k=0, k=2, k=4, k=6 diagonally into two halves
    for (let k = 0; k < specialLines.length; k++) {
      const currentLineIndex = specialLines[k];
      const nextLineIndex = specialLines[(k + 1) % specialLines.length];
      
      // Calculate the center angle for this sector (without rotation applied yet)
      const baseCurrentAngle = currentLineIndex * angleStep;
      let baseNextAngle = nextLineIndex * angleStep;
      
      // Handle wraparound case for the last sector
      if (k === specialLines.length - 1) {
        baseNextAngle = specialLines[0] * angleStep + 2 * Math.PI;
      }
      
      // Split sectors at k=0 (region 33), k=2 (region 36), k=4 (region 38), k=6 (region 40) diagonally
      if (k === 0 || k === 2 || k === 4 || k === 6) {
        // Split sector diagonally into two halves
        const sectorMidAngle = (baseCurrentAngle + baseNextAngle) / 2;
        
        // Add diagonal line to visually divide the sector - from red polygon to black polygon boundary
        const diagonalAngle = sectorMidAngle + rotationRad + northOffset;
        
        // Find intersection points with both polygons (like other radial lines)
        const redBoundaryPoint = getRayIntersectionWithPolygon(center, diagonalAngle, redPolygonPoints);
        const blackBoundaryPoint = getRayIntersectionWithPolygon(center, diagonalAngle, polygonPoints);
        
        if (redBoundaryPoint && blackBoundaryPoint && !hasExisting) {
          // Create diagonal division line from red polygon boundary to black polygon boundary
          const diagonalLine = new Line(
            [redBoundaryPoint.x, redBoundaryPoint.y, blackBoundaryPoint.x, blackBoundaryPoint.y],
            {
              stroke: '#000000',
              strokeWidth: 2,
              selectable: false,
              evented: false,
              objectCaching: false,
              isDiagonalDivision: true,
              sectorIndex: k // Add sector index to identify which diagonal line this is
            }
          );
          fabricCanvas.add(diagonalLine);
          newObjects.push(diagonalLine);
        } else if (hasExisting) {
          // Update existing diagonal line during rotation
          const existingDiagonalLine = fabricCanvas.getObjects().find(obj => 
            obj instanceof Line && 
            (obj as any).isDiagonalDivision === true &&
            (obj as any).sectorIndex === k
          ) as unknown as Line;
          
          if (existingDiagonalLine && redBoundaryPoint && blackBoundaryPoint) {
            existingDiagonalLine.set({
              x1: redBoundaryPoint.x,
              y1: redBoundaryPoint.y,
              x2: blackBoundaryPoint.x,
              y2: blackBoundaryPoint.y,
              visible: true
            });
          } else if (!existingDiagonalLine && redBoundaryPoint && blackBoundaryPoint) {
            // Create new diagonal line if it doesn't exist
            const diagonalLine = new Line(
              [redBoundaryPoint.x, redBoundaryPoint.y, blackBoundaryPoint.x, blackBoundaryPoint.y],
              {
                stroke: '#000000',
                strokeWidth: 2,
                selectable: false,
                evented: false,
                objectCaching: false,
                isDiagonalDivision: true,
                sectorIndex: k
              }
            );
            fabricCanvas.add(diagonalLine);
            newObjects.push(diagonalLine);
          }
        }
        
        // First half of divided sector
        let baseCenterAngle = (baseCurrentAngle + sectorMidAngle) / 2;
        let finalCenterAngle = baseCenterAngle + rotationRad + northOffset;
        
        // Create region label for first half (region 33)
        let labelX = center.x;
        let labelY = center.y;
        const redBoundaryPoint1 = getRayIntersectionWithPolygon(center, finalCenterAngle, redPolygonPoints);
        const blackBoundaryPoint1 = getRayIntersectionWithPolygon(center, finalCenterAngle, polygonPoints);
        
        if (redBoundaryPoint1 && blackBoundaryPoint1) {
          const redDistance = Math.hypot(redBoundaryPoint1.x - center.x, redBoundaryPoint1.y - center.y);
          const blackDistance = Math.hypot(blackBoundaryPoint1.x - center.x, blackBoundaryPoint1.y - center.y);
          const targetDistance = redDistance + (blackDistance - redDistance) * 0.6;
          let targetX = center.x + Math.cos(finalCenterAngle) * targetDistance;
          let targetY = center.y + Math.sin(finalCenterAngle) * targetDistance;
          
          const targetPoint = { x: targetX, y: targetY };
          const isInsideBlackPolygon = isPointInPolygon(targetPoint, polygonPoints);
          
          if (isInsideBlackPolygon) {
            labelX = targetX;
            labelY = targetY;
          } else {
            const safetyMargin = 10;
            const safeDistance = Math.max(redDistance + 5, blackDistance - safetyMargin);
            labelX = center.x + Math.cos(finalCenterAngle) * safeDistance;
            labelY = center.y + Math.sin(finalCenterAngle) * safeDistance;
            
            const safePoint = { x: labelX, y: labelY };
            if (!isPointInPolygon(safePoint, polygonPoints)) {
              const fallbackDistance = redDistance + (blackDistance - redDistance) * 0.3;
              labelX = center.x + Math.cos(finalCenterAngle) * fallbackDistance;
              labelY = center.y + Math.sin(finalCenterAngle) * fallbackDistance;
            }
          }
        }
        
        if (hasExisting) {
          const existingRegionLabel = fabricCanvas.getObjects().find(obj => 
            obj instanceof Text && 
            (obj as any).regionNumber === regionNumber
          ) as unknown as Text;
          
          if (existingRegionLabel) {
            existingRegionLabel.set({
              left: labelX - 8,
              top: labelY - 8,
              text: getRegionNumber(regionNumber).toString(),
              visible: true
            });
          }
        } else {
          const regionLabel = new Text(getRegionNumber(regionNumber).toString(), {
            left: labelX - 8,
            top: labelY - 8,
            fontSize: 14,
            fill: '#0000ff',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            selectable: false,
            evented: false,
            textAlign: 'center',
            objectCaching: false,
            regionNumber: regionNumber,
            sectorIndex: k
          });
          
          fabricCanvas.add(regionLabel);
          newObjects.push(regionLabel);
        }
        regionNumber++;
        
        // Second half of divided sector
        baseCenterAngle = (sectorMidAngle + baseNextAngle) / 2;
        finalCenterAngle = baseCenterAngle + rotationRad + northOffset;
        
        labelX = center.x;
        labelY = center.y;
        const redBoundaryPoint2 = getRayIntersectionWithPolygon(center, finalCenterAngle, redPolygonPoints);
        const blackBoundaryPoint2 = getRayIntersectionWithPolygon(center, finalCenterAngle, polygonPoints);
        
        if (redBoundaryPoint2 && blackBoundaryPoint2) {
          const redDistance = Math.hypot(redBoundaryPoint2.x - center.x, redBoundaryPoint2.y - center.y);
          const blackDistance = Math.hypot(blackBoundaryPoint2.x - center.x, blackBoundaryPoint2.y - center.y);
          const targetDistance = redDistance + (blackDistance - redDistance) * 0.6;
          let targetX = center.x + Math.cos(finalCenterAngle) * targetDistance;
          let targetY = center.y + Math.sin(finalCenterAngle) * targetDistance;
          
          const targetPoint = { x: targetX, y: targetY };
          const isInsideBlackPolygon = isPointInPolygon(targetPoint, polygonPoints);
          
          if (isInsideBlackPolygon) {
            labelX = targetX;
            labelY = targetY;
          } else {
            const safetyMargin = 10;
            const safeDistance = Math.max(redDistance + 5, blackDistance - safetyMargin);
            labelX = center.x + Math.cos(finalCenterAngle) * safeDistance;
            labelY = center.y + Math.sin(finalCenterAngle) * safeDistance;
            
            const safePoint = { x: labelX, y: labelY };
            if (!isPointInPolygon(safePoint, polygonPoints)) {
              const fallbackDistance = redDistance + (blackDistance - redDistance) * 0.3;
              labelX = center.x + Math.cos(finalCenterAngle) * fallbackDistance;
              labelY = center.y + Math.sin(finalCenterAngle) * fallbackDistance;
            }
          }
        }
        
        if (hasExisting) {
          const existingRegionLabel = fabricCanvas.getObjects().find(obj => 
            obj instanceof Text && 
            (obj as any).regionNumber === regionNumber
          ) as unknown as Text;
          
          if (existingRegionLabel) {
            existingRegionLabel.set({
              left: labelX - 8,
              top: labelY - 8,
              text: getRegionNumber(regionNumber).toString(),
              visible: true
            });
          }
        } else {
          const regionLabel = new Text(getRegionNumber(regionNumber).toString(), {
            left: labelX - 8,
            top: labelY - 8,
            fontSize: 14,
            fill: '#0000ff',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            selectable: false,
            evented: false,
            textAlign: 'center',
            objectCaching: false,
            regionNumber: regionNumber,
            sectorIndex: k
          });
          
          fabricCanvas.add(regionLabel);
          newObjects.push(regionLabel);
        }
        regionNumber++;
      } else {
        // Regular sector processing for non-divided regions
        const baseCenterAngle = (baseCurrentAngle + baseNextAngle) / 2;
        const finalCenterAngle = baseCenterAngle + rotationRad + northOffset;
        
        let labelX = center.x;
        let labelY = center.y;
        
        const redBoundaryPoint = getRayIntersectionWithPolygon(center, finalCenterAngle, redPolygonPoints);
        const blackBoundaryPoint = getRayIntersectionWithPolygon(center, finalCenterAngle, polygonPoints);
        
        if (redBoundaryPoint && blackBoundaryPoint) {
          const redDistance = Math.hypot(redBoundaryPoint.x - center.x, redBoundaryPoint.y - center.y);
          const blackDistance = Math.hypot(blackBoundaryPoint.x - center.x, blackBoundaryPoint.y - center.y);
          const targetDistance = redDistance + (blackDistance - redDistance) * 0.6;
          let targetX = center.x + Math.cos(finalCenterAngle) * targetDistance;
          let targetY = center.y + Math.sin(finalCenterAngle) * targetDistance;
          
          const targetPoint = { x: targetX, y: targetY };
          const isInsideBlackPolygon = isPointInPolygon(targetPoint, polygonPoints);
          
          if (isInsideBlackPolygon) {
            labelX = targetX;
            labelY = targetY;
          } else {
            const safetyMargin = 10;
            const safeDistance = Math.max(redDistance + 5, blackDistance - safetyMargin);
            labelX = center.x + Math.cos(finalCenterAngle) * safeDistance;
            labelY = center.y + Math.sin(finalCenterAngle) * safeDistance;
            
            const safePoint = { x: labelX, y: labelY };
            if (!isPointInPolygon(safePoint, polygonPoints)) {
              const fallbackDistance = redDistance + (blackDistance - redDistance) * 0.3;
              labelX = center.x + Math.cos(finalCenterAngle) * fallbackDistance;
              labelY = center.y + Math.sin(finalCenterAngle) * fallbackDistance;
            }
          }
        }
        
        if (hasExisting) {
          const existingRegionLabel = fabricCanvas.getObjects().find(obj => 
            obj instanceof Text && 
            (obj as any).regionNumber === regionNumber
          ) as unknown as Text;
          
          if (existingRegionLabel) {
            existingRegionLabel.set({
              left: labelX - 8,
              top: labelY - 8,
              text: getRegionNumber(regionNumber).toString(),
              visible: true
            });
          }
        } else {
          const regionLabel = new Text(getRegionNumber(regionNumber).toString(), {
            left: labelX - 8,
            top: labelY - 8,
            fontSize: 14,
            fill: '#0000ff',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            selectable: false,
            evented: false,
            textAlign: 'center',
            objectCaching: false,
            regionNumber: regionNumber,
            sectorIndex: k
          });
          
          fabricCanvas.add(regionLabel);
          newObjects.push(regionLabel);
        }
        
        regionNumber++;
      }
    }

    // Update state and render
    if (!hasExisting) {
      setGridLines(newObjects);
    }
    
    // Re-enable selection and render
    fabricCanvas.selection = true;
    if ((fabricCanvas as any).requestRenderAll) {
      (fabricCanvas as any).requestRenderAll();
    } else {
      fabricCanvas.renderAll();
    }
  }, [fabricCanvas, rotationDegree, gridLines]);

  const clearGrid = () => {
    if (!fabricCanvas) return;
    
    gridLines.forEach(line => {
      fabricCanvas.remove(line);
    });
    setGridLines([]);
  };

  const drawMediumPolygon = (polygonPoints: Point[], center: Point) => {
    if (!fabricCanvas) return;

    // Remove existing medium polygon
    if (mediumPolygon) {
      fabricCanvas.remove(mediumPolygon);
      setMediumPolygon(null);
    }

    // Calculate scale factor for 62% area (√0.62 ≈ 0.787)
    const areaScaleFactor = 0.62;
    const linearScaleFactor = Math.sqrt(areaScaleFactor);

    console.log('Creating medium polygon with scale factor:', linearScaleFactor);

    // Position medium polygon at the same center as the main polygon and small polygon
    // This ensures equal spacing from all sides of the main polygon
    const scaledPoints = polygonPoints.map(point => {
      // Translate to origin (same center as main polygon)
      const translatedX = point.x - center.x;
      const translatedY = point.y - center.y;
      
      // Scale
      const scaledX = translatedX * linearScaleFactor;
      const scaledY = translatedY * linearScaleFactor;
      
      // Translate back to center position (same center as main polygon)
      return {
        x: scaledX + center.x,
        y: scaledY + center.y
      };
    });

    console.log('Medium polygon points:', scaledPoints);

    // Create medium polygon with transparent fill and black boundary
    const fabricPoints = scaledPoints.map(p => ({ x: p.x, y: p.y }));
    const mediumPoly = new Polygon(fabricPoints, {
      fill: 'transparent', // No fill - transparent inside
      stroke: '#000000', // Black border
      strokeWidth: 3,
      selectable: false,
      evented: false
    });

    // Add and ensure proper layering
    fabricCanvas.add(mediumPoly);
    
    // Make sure it's rendered properly in the layer order
    fabricCanvas.bringObjectToFront(mediumPoly);
    
    setMediumPolygon(mediumPoly);
    fabricCanvas.renderAll();

    const mediumArea = calculatePolygonArea(scaledPoints);
    const originalArea = calculatePolygonArea(polygonPoints);
    const actualPercentage = (mediumArea / originalArea) * 100;
    
    console.log('Medium polygon area:', mediumArea);
    console.log('Medium actual percentage:', actualPercentage);
    
    toast.success(`Medium polygon created with ${actualPercentage.toFixed(1)}% area (${mediumArea.toFixed(2)} sq units)`);
  };

  // Vithi Mandal Functions - Copy of 45 devtas but without radial lines
  const drawVithiMandalPolygons = (polygonPoints: Point[], center: Point) => {
    if (!fabricCanvas) return;
    
    // Clear existing vithi mandal polygons
    clearVithiMandalPolygons();
    
    // Create red polygon (11% area - same as small polygon)
    const redAreaFactor = 0.11;
    const redScale = Math.sqrt(redAreaFactor);
    const redPoints = polygonPoints.map(point => ({
      x: center.x + (point.x - center.x) * redScale,
      y: center.y + (point.y - center.y) * redScale
    }));
    
    // Create black polygon (62% area - same as medium polygon)
    const blackAreaFactor = 0.62;
    const blackScale = Math.sqrt(blackAreaFactor);
    const blackPoints = polygonPoints.map(point => ({
      x: center.x + (point.x - center.x) * blackScale,
      y: center.y + (point.y - center.y) * blackScale
    }));
    
    // Create center polygon (50% area between red and black = 36.5% area)
    const centerAreaFactor = (redAreaFactor + blackAreaFactor) / 2; // 36.5%
    const centerScale = Math.sqrt(centerAreaFactor);
    const centerPoints = polygonPoints.map(point => ({
      x: center.x + (point.x - center.x) * centerScale,
      y: center.y + (point.y - center.y) * centerScale
    }));
    
    const newVithiPolygons: any[] = [];
    
    // Create red polygon
    const redFabricPoints = redPoints.map(p => ({ x: p.x, y: p.y }));
    const redPoly = new Polygon(redFabricPoints, {
      fill: 'transparent',
      stroke: '#ff0000', // Red
      strokeWidth: 3,
      selectable: false,
      evented: false
    });
    fabricCanvas.add(redPoly);
    newVithiPolygons.push(redPoly);
    
    // Create black polygon
    const blackFabricPoints = blackPoints.map(p => ({ x: p.x, y: p.y }));
    const blackPoly = new Polygon(blackFabricPoints, {
      fill: 'transparent',
      stroke: '#000000', // Black
      strokeWidth: 3,
      selectable: false,
      evented: false
    });
    fabricCanvas.add(blackPoly);
    newVithiPolygons.push(blackPoly);
    
    // Create center polygon (blue)
    const centerFabricPoints = centerPoints.map(p => ({ x: p.x, y: p.y }));
    const centerPoly = new Polygon(centerFabricPoints, {
      fill: 'transparent',
      stroke: '#0066cc', // Blue
      strokeWidth: 3,
      selectable: false,
      evented: false
    });
    fabricCanvas.add(centerPoly);
    newVithiPolygons.push(centerPoly);
    
    // Ensure proper layering
    newVithiPolygons.forEach(poly => fabricCanvas.bringObjectToFront(poly));
    
    setVithiMandalPolygons(newVithiPolygons);
    
    // Calculate areas for display
    const redArea = calculatePolygonArea(redPoints);
    const blackArea = calculatePolygonArea(blackPoints);
    const centerArea = calculatePolygonArea(centerPoints);
    const originalArea = calculatePolygonArea(polygonPoints);
    
    console.log('Vithi Mandal - Red area:', redArea, `(${(redArea/originalArea*100).toFixed(1)}%)`);
    console.log('Vithi Mandal - Black area:', blackArea, `(${(blackArea/originalArea*100).toFixed(1)}%)`);
    console.log('Vithi Mandal - Center area:', centerArea, `(${(centerArea/originalArea*100).toFixed(1)}%)`);
    
    toast.success(`Vithi Mandal created with center polygon at ${(centerArea/originalArea*100).toFixed(1)}% area`);
  };

  const clearVithiMandalPolygons = () => {
    if (!fabricCanvas) return;
    
    // More comprehensive clearing - remove all vithi mandal related objects
    const allObjects = fabricCanvas.getObjects();
    const vithiObjects = allObjects.filter(obj => {
      // Remove any text objects that might be vithi mandal labels
      return (obj instanceof Text && (
        obj.text?.includes('shetra') || 
        obj.text?.includes('क्षेत्र') ||
        obj.text?.includes('Brahma') ||
        obj.text?.includes('Manushya') ||
        obj.text?.includes('Dev')
      )) || vithiMandalPolygons.includes(obj);
    });
    
    vithiObjects.forEach(obj => {
      fabricCanvas.remove(obj);
    });
    
    vithiMandalPolygons.forEach(poly => {
      fabricCanvas.remove(poly);
    });
    setVithiMandalPolygons([]);
    
    fabricCanvas.renderAll();
  };

  const drawCentral12Devtas = (polygonPoints: Point[], totalArea: number, center: Point) => {
    if (!fabricCanvas) return;

    // Clear existing devta zones
    devtaZones.forEach(zone => {
      fabricCanvas.remove(zone);
    });
    setDevtaZones([]);

    // Use the full red polygon (not the scaled central polygon)
    // Create 8 specific radial lines (2,7,10,15,18,23,26,31) extending to red polygon boundary
    const result = createCentral12DevtaGrid(polygonPoints, totalArea);
    
    const newDevtaObjects: any[] = [];

    // Draw only the 8 radial lines from center to red polygon boundary
    result.radialLines.forEach(line => {
      const [startPoint, endPoint] = line;
      
      const fabricLine = new Line([startPoint.x, startPoint.y, endPoint.x, endPoint.y], {
        stroke: '#000000', // Black lines
        strokeWidth: 2,
        selectable: false,  
        evented: false
      });

      fabricCanvas.add(fabricLine);
      newDevtaObjects.push(fabricLine);
    });

    setDevtaZones(newDevtaObjects);
    console.log('Drew 8 radial lines to red polygon boundary');
  };

  // Clear all direction lines with comprehensive cleanup
  const clearDirectionLines = useCallback(() => {
    if (!fabricCanvas) return;
    
    console.log('Clearing direction lines, current count:', directionLines.length);
    
    // Method 1: Remove tracked objects
    if (directionLines.length > 0) {
      directionLines.forEach(obj => {
        try {
          if (fabricCanvas.contains(obj)) {
            fabricCanvas.remove(obj);
          }
        } catch (error) {
          console.warn('Failed to remove tracked direction object:', error);
        }
      });
    }
    
    // Method 2: Find and remove any remaining direction objects by properties
    const allObjects = fabricCanvas.getObjects();
    const directionObjects = allObjects.filter(obj => {
      return (obj instanceof Line && obj.stroke === '#000000') ||
             (obj instanceof Text && obj.fill === '#000000');
    });
    
    if (directionObjects.length > 0) {
      console.log('Found additional direction objects to remove:', directionObjects.length);
      directionObjects.forEach(obj => {
        try {
          fabricCanvas.remove(obj);
        } catch (error) {
          console.warn('Failed to remove found direction object:', error);
        }
      });
    }
    
    // Clear the state
    setDirectionLines([]);
    
    // Force render
    fabricCanvas.renderAll();
    
    console.log('Direction lines cleared, remaining objects:', fabricCanvas.getObjects().length);
  }, [fabricCanvas, directionLines]);

  // Draw or update 16 directions in-place for smooth rotation (no flicker)
  const draw16Directions = useCallback((polygonPoints: Point[], center: Point) => {
    if (!fabricCanvas || !show16Directions) return;

    const directions = [
      'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
    ];

    const angleStep = (Math.PI * 2) / 16; // 22.5° each
    const ROTATION_OFFSET = -10; // System offset for directional alignment
    const rotationRad = ((rotationDegree + ROTATION_OFFSET) * Math.PI) / 180;
    const northOffset = -Math.PI / 2; // 0° = North (up)

    const hasExisting = directionLines.length >= 32; // 16 lines + 16 labels
    const newObjects: any[] = [];

    // Disable selection for performance while updating
    fabricCanvas.selection = false;

    for (let i = 0; i < 16; i++) {
      const angle = i * angleStep + rotationRad + northOffset;
      const boundaryPoint = getRayIntersectionWithPolygon(center, angle, polygonPoints);

      const middleAngle = angle + angleStep / 2;
      let labelX = center.x;
      let labelY = center.y;

      if (boundaryPoint) {
        const labelDistance = Math.hypot(boundaryPoint.x - center.x, boundaryPoint.y - center.y) * 0.75;
        labelX = center.x + Math.cos(middleAngle) * labelDistance;
        labelY = center.y + Math.sin(middleAngle) * labelDistance;
      }

      if (hasExisting) {
        const line = directionLines[2 * i] as unknown as Line;
        const label = directionLines[2 * i + 1] as unknown as Text;
        if (boundaryPoint) {
          line.set({ x1: center.x, y1: center.y, x2: boundaryPoint.x, y2: boundaryPoint.y, visible: true });
          label.set({ left: labelX, top: labelY, text: directions[i], visible: true });
        } else {
          line.set({ visible: false });
          label.set({ visible: false });
        }
      } else if (boundaryPoint) {
        const line = new Line([center.x, center.y, boundaryPoint.x, boundaryPoint.y], {
          stroke: '#000000',
          strokeWidth: 2,
          selectable: false,
          evented: false,
          objectCaching: false,
          isDirectionLine: true,
        });
        newObjects.push(line);

        const label = new Text(directions[i], {
          left: labelX,
          top: labelY,
          fontSize: 16,
          fill: '#000000',
          fontFamily: 'Arial Black',
          fontWeight: 'bold',
          selectable: false,
          evented: false,
          textAlign: 'center',
          originX: 'center',
          originY: 'center',
          objectCaching: false,
          isDirectionLabel: true,
        });
        newObjects.push(label);
      }
    }

    if (!hasExisting && newObjects.length > 0) {
      fabricCanvas.add(...newObjects);
      setDirectionLines(newObjects);
    }

    // Re-enable selection and render
    fabricCanvas.selection = true;
    if ((fabricCanvas as any).requestRenderAll) {
      (fabricCanvas as any).requestRenderAll();
    } else {
      fabricCanvas.renderAll();
    }
  }, [fabricCanvas, rotationDegree, show16Directions, directionLines]);

  const toggle16Directions = () => {
    if (!fabricCanvas) return;
    
    const newShow16Directions = !show16Directions;
    setShow16Directions(newShow16Directions);

    if (!newShow16Directions) {
      // Disabling: clear existing objects
      clearDirectionLines();
    } else if (completedPolygonPoints.length >= 3) {
      // Enabling: create (or update) instantly without clearing
      const center = calculatePolygonCenterLocal(completedPolygonPoints);
      draw16Directions(completedPolygonPoints, center);
    }

    toast.success(`16 directions ${newShow16Directions ? 'enabled' : 'disabled'}`);
  };

  // Smooth, instant in-place updates while sliding (no debounce, no clearing)
  useEffect(() => {
    if (show16Directions && currentPolygon && completedPolygonPoints.length >= 3 && fabricCanvas) {
      const center = calculatePolygonCenterLocal(completedPolygonPoints);
      draw16Directions(completedPolygonPoints, center);
    }
  }, [rotationDegree, show16Directions, currentPolygon, completedPolygonPoints, fabricCanvas, draw16Directions]);

  // Clear all 32 gates lines and labels
  const clearGateLines = useCallback(() => {
    if (!fabricCanvas) return;
    
    console.log('Clearing gate lines, current count:', gateLines.length);
    
    // Method 1: Remove tracked objects
    if (gateLines.length > 0) {
      gateLines.forEach(obj => {
        try {
          if (fabricCanvas.contains(obj)) {
            fabricCanvas.remove(obj);
          }
        } catch (error) {
          console.warn('Failed to remove tracked gate object:', error);
        }
      });
    }
    
    // Method 2: Find and remove any remaining gate objects by properties
    const allObjects = fabricCanvas.getObjects();
    const gateObjects = allObjects.filter(obj => {
      return ((obj as any).isGateLine === true) || ((obj as any).isGateLabel === true);
    });
    
    if (gateObjects.length > 0) {
      console.log('Found additional gate objects to remove:', gateObjects.length);
      gateObjects.forEach(obj => {
        try {
          fabricCanvas.remove(obj);
        } catch (error) {
          console.warn('Failed to remove found gate object:', error);
        }
      });
    }
    
    // Clear the state
    setGateLines([]);
    
    // Force render
    fabricCanvas.renderAll();
    
    console.log('Gate lines cleared, remaining objects:', fabricCanvas.getObjects().length);
  }, [fabricCanvas, gateLines]);

  // Draw or update 32 gates in-place for smooth rotation (no flicker)
  const draw32Gates = useCallback((polygonPoints: Point[], center: Point) => {
    if (!fabricCanvas || !show32Gates) return;

    const N = 32;
    const angleStep = (Math.PI * 2) / N; // 11.25° each
    const ROTATION_OFFSET = -10; // System offset for directional alignment
    const rotationRad = ((rotationDegree + ROTATION_OFFSET) * Math.PI) / 180;
    const northOffset = -Math.PI / 2; // 0° = North (up)

    // Custom gate labels mapping
    const gateLabels = [
      'N4', 'N5', 'N6', 'N7', 'N8', 'E1', 'E2', 'E3',
      'E4', 'E5', 'E6', 'E7', 'E8', 'S1', 'S2', 'S3',
      'S4', 'S5', 'S6', 'S7', 'S8', 'W1', 'W2', 'W3',
      'W4', 'W5', 'W6', 'W7', 'W8', 'N1', 'N2', 'N3'
    ];

    const hasExisting = gateLines.length >= 64; // 32 lines + 32 labels
    const newObjects: any[] = [];

    // Disable selection for performance while updating
    fabricCanvas.selection = false;

    for (let i = 0; i < N; i++) {
      const angle = i * angleStep + rotationRad + northOffset;
      const boundaryPoint = getRayIntersectionWithPolygon(center, angle, polygonPoints);

      const middleAngle = angle + angleStep / 2;
      let labelX = center.x;
      let labelY = center.y;

      if (boundaryPoint) {
        const labelDistance = Math.hypot(boundaryPoint.x - center.x, boundaryPoint.y - center.y) * 0.75;
        labelX = center.x + Math.cos(middleAngle) * labelDistance;
        labelY = center.y + Math.sin(middleAngle) * labelDistance;
      }

      if (hasExisting) {
        const line = gateLines[2 * i] as unknown as Line;
        const label = gateLines[2 * i + 1] as unknown as Text;
        if (boundaryPoint) {
          line.set({ x1: center.x, y1: center.y, x2: boundaryPoint.x, y2: boundaryPoint.y, visible: true });
          label.set({ left: labelX, top: labelY, text: gateLabels[i], visible: true });
        } else {
          line.set({ visible: false });
          label.set({ visible: false });
        }
      } else if (boundaryPoint) {
        const line = new Line([center.x, center.y, boundaryPoint.x, boundaryPoint.y], {
          stroke: '#000000',
          strokeWidth: 2,
          selectable: false,
          evented: false,
          objectCaching: false,
          isGateLine: true,
        });
        newObjects.push(line);

        const label = new Text(gateLabels[i], {
          left: labelX,
          top: labelY,
          fontSize: 14,
          fill: '#000000',
          fontFamily: 'Arial Black',
          fontWeight: 'bold',
          selectable: false,
          evented: false,
          textAlign: 'center',
          originX: 'center',
          originY: 'center',
          objectCaching: false,
          isGateLabel: true,
        });
        newObjects.push(label);
      }
    }

    if (!hasExisting && newObjects.length > 0) {
      fabricCanvas.add(...newObjects);
      setGateLines(newObjects);
    }

    // Re-enable selection and render
    fabricCanvas.selection = true;
    if ((fabricCanvas as any).requestRenderAll) {
      (fabricCanvas as any).requestRenderAll();
    } else {
      fabricCanvas.renderAll();
    }
  }, [fabricCanvas, rotationDegree, show32Gates, gateLines]);

  const toggle32Gates = () => {
    if (!fabricCanvas) return;
    
    const newShow32Gates = !show32Gates;
    setShow32Gates(newShow32Gates);

    if (!newShow32Gates) {
      // Disabling: clear existing objects
      clearGateLines();
    } else if (completedPolygonPoints.length >= 3) {
      // Enabling: create (or update) instantly without clearing
      const center = calculatePolygonCenterLocal(completedPolygonPoints);
      draw32Gates(completedPolygonPoints, center);
    }

    toast.success(`32 gates ${newShow32Gates ? 'enabled' : 'disabled'}`);
  };




  // Calculate 16-direction area distribution
  const calculate16DirectionAreas = (polygonPoints: Point[]) => {
    if (polygonPoints.length < 3) return [];

    const center = calculatePolygonCenterLocal(polygonPoints);
    const totalArea = calculatePolygonArea(polygonPoints);
    
    // Create 32 sectors first, then group into 16 directions
    const N = 32;
    const angleStep = (Math.PI * 2) / N; // 11.25° each
    const ROTATION_OFFSET = -10; // System offset for directional alignment
    const rotationRad = ((rotationDegree + ROTATION_OFFSET) * Math.PI) / 180;
    const northOffset = -Math.PI / 2; // 0° = North (up)

    // Calculate area for each of the 32 sectors
    const sectorAreas: number[] = [];
    
    for (let i = 0; i < N; i++) {
      const startAngle = i * angleStep + rotationRad + northOffset;
      const endAngle = (i + 1) * angleStep + rotationRad + northOffset;
      
      // Get boundary points for this sector
      const startBoundary = getRayIntersectionWithPolygon(center, startAngle, polygonPoints);
      const endBoundary = getRayIntersectionWithPolygon(center, endAngle, polygonPoints);
      
      if (startBoundary && endBoundary) {
        // Create sector polygon: center -> start boundary -> end boundary -> center
        const sectorPolygon = [center, startBoundary, endBoundary];
        
        // Calculate area of this triangular sector
        const sectorArea = calculatePolygonArea(sectorPolygon);
        sectorAreas.push(sectorArea);
      } else {
        sectorAreas.push(0);
      }
    }

    // 16 compass directions - each covers 2 sectors (22.5° total)
    const directions = [
      'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
    ];

    // Group 32 sectors into 16 directions (2 sectors per direction)
    return directions.map((dirName, dirIndex) => {
      // Each direction covers 2 adjacent sectors
      const sector1Index = (dirIndex * 2) % N;
      const sector2Index = (dirIndex * 2 + 1) % N;
      
      const directionArea = sectorAreas[sector1Index] + sectorAreas[sector2Index];
      const percentage = totalArea > 0 ? (directionArea / totalArea) * 100 : 0;
      
      return {
        direction: dirName,
        area: directionArea,
        percentage: percentage
      };
    });
  };

  // Export function for downloading the canvas
  const exportCanvasAsImage = async () => {
  };

  // Helper function to check if point is inside polygon
  const isPointInPolygon = (point: Point, polygon: Point[]) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
          (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
        inside = !inside;
      }
    }
    return inside;
  };

  const toggle16BarChart = () => {
    setShow16BarChart(!show16BarChart);
    toast.success(`16 bar chart ${!show16BarChart ? 'opened' : 'closed'}`);
  };

  const toggleDevtaNamesDialog = () => {
    setShowDevtaNamesDialog(!showDevtaNamesDialog);
    toast.success(`45 devtas names ${!showDevtaNamesDialog ? 'opened' : 'closed'}`);
  };

  const toggleVithiMandal = () => {
    if (!fabricCanvas) return;
    
    const newShowVithiMandal = !showVithiMandal;
    setShowVithiMandal(newShowVithiMandal);
    
    if (newShowVithiMandal) {
      // Enable: draw vithi mandal polygons
      if (completedPolygonPoints.length >= 3) {
        const center = calculatePolygonCenterLocal(completedPolygonPoints);
        drawVithiMandalPolygons(completedPolygonPoints, center);
      }
    } else {
      // Disable: clear vithi mandal polygons
      clearVithiMandalPolygons();
    }
    
    fabricCanvas.renderAll();
    console.log("Vithi mandal toggled:", newShowVithiMandal, "Canvas objects:", fabricCanvas.getObjects().length);
    toast.success(`Vithi mandal ${newShowVithiMandal ? 'enabled' : 'disabled'}`);
  };

  // Smooth updates for 32 gates rotation
  useEffect(() => {
    if (show32Gates && currentPolygon && completedPolygonPoints.length >= 3 && fabricCanvas) {
      const center = calculatePolygonCenterLocal(completedPolygonPoints);
      draw32Gates(completedPolygonPoints, center);
    }
  }, [rotationDegree, show32Gates, currentPolygon, completedPolygonPoints, fabricCanvas, draw32Gates]);


  // Clear Marma Sthan lines
  const clearMarmaSthanLine = useCallback(() => {
    if (!fabricCanvas) return;
    
    // Remove all tracked lines
    marmaSthanLines.forEach(line => {
      if (fabricCanvas.contains(line)) {
        fabricCanvas.remove(line);
      }
    });
    setMarmaSthanLines([]);
    
    // Also remove any existing marma sthan lines by checking all objects
    const existingLines = fabricCanvas.getObjects().filter(obj => 
      obj instanceof Line && obj.stroke === '#ff0000' && obj.strokeDashArray
    );
    existingLines.forEach(line => fabricCanvas.remove(line));
    
    fabricCanvas.renderAll();
    console.log('Marma Sthan lines cleared');
  }, [fabricCanvas, marmaSthanLines]);

  // Draw Marma Sthan (red lines connecting specific block pairs from 45 devta system)
  const drawMarmaSthan = useCallback((polygonPoints: Point[], center: Point) => {
    if (!fabricCanvas || !showMarmaSthan) return;

    // Clear existing lines first - more thorough cleanup
    marmaSthanLines.forEach(line => {
      if (fabricCanvas.contains(line)) {
        fabricCanvas.remove(line);
      }
    });
    setMarmaSthanLines([]);

    // Also remove any existing marma sthan lines by checking all objects
    const existingLines = fabricCanvas.getObjects().filter(obj => 
      (obj instanceof Line && obj.stroke === '#ff0000') || 
      (obj instanceof Circle && obj.fill === '#000000' && obj.radius === 4)
    );
    existingLines.forEach(line => fabricCanvas.remove(line));

    const newLines: any[] = [];

    // Calculate block positions using same logic as 45 devta system
    const N = 32;
    const angleStep = (Math.PI * 2) / N;
    const ROTATION_OFFSET = -10; // System offset for directional alignment
    const DEVTA_ADJUSTMENT = 4; // +4 degrees clockwise rotation for 45 devtas
    const rotationRad = ((rotationDegree + ROTATION_OFFSET + DEVTA_ADJUSTMENT) * Math.PI) / 180;
    const northOffset = -Math.PI / 2; // 0° = North (up)

    // Define the block pairs to connect
    const blockPairs = [
      [31, 11], // 31-11
      [3, 23],  // 3-23
      [5, 21],  // 5-21
      [7, 19],  // 7-19
      [15, 27], // 15-27
      [13, 29]  // 13-29
    ];

    // Get center points of any block
    const getBlockCenter = (blockNumber: number) => {
      const blockIndex = blockNumber - 1; // Convert to 0-based index
      const angle1 = blockIndex * angleStep + rotationRad + northOffset;
      const angle2 = ((blockIndex + 1) % N) * angleStep + rotationRad + northOffset;
      
      // Get inner and outer boundary points for this block
      const redPolygonScale = 0.8;
      const innerPolygonPoints = polygonPoints.map(p => ({
        x: center.x + (p.x - center.x) * redPolygonScale,
        y: center.y + (p.y - center.y) * redPolygonScale,
      }));
      
      const outer1 = getRayIntersectionWithPolygon(center, angle1, polygonPoints);
      const outer2 = getRayIntersectionWithPolygon(center, angle2, polygonPoints);
      const inner1 = getRayIntersectionWithPolygon(center, angle1, innerPolygonPoints);
      const inner2 = getRayIntersectionWithPolygon(center, angle2, innerPolygonPoints);
      
      if (!outer1 || !outer2 || !inner1 || !inner2) return center;
      
      // Calculate center of the block (quadrilateral)
      const blockCenterX = (inner1.x + inner2.x + outer1.x + outer2.x) / 4;
      const blockCenterY = (inner1.y + inner2.y + outer1.y + outer2.y) / 4;
      
      return { x: blockCenterX, y: blockCenterY };
    };

    // Helper function to calculate line-line intersection
    const getLineIntersection = (line1Start: Point, line1End: Point, line2Start: Point, line2End: Point): Point | null => {
      const x1 = line1Start.x, y1 = line1Start.y;
      const x2 = line1End.x, y2 = line1End.y;
      const x3 = line2Start.x, y3 = line2Start.y;
      const x4 = line2End.x, y4 = line2End.y;

      const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
      if (Math.abs(denom) < 1e-10) return null; // Lines are parallel

      const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
      const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

      // Check if intersection is within both line segments
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {
          x: x1 + t * (x2 - x1),
          y: y1 + t * (y2 - y1)
        };
      }
      return null;
    };

    // Store line endpoints for intersection calculation
    const lineEndpoints: { start: Point, end: Point }[] = [];

    // Create lines for each block pair
    blockPairs.forEach(([block1, block2]) => {
      const block1Center = getBlockCenter(block1);
      const block2Center = getBlockCenter(block2);

      // Create direction from block1 center to block2 center
      const direction = {
        x: block2Center.x - block1Center.x,
        y: block2Center.y - block1Center.y
      };
      
      // Normalize the direction
      const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
      if (length > 0) {
        direction.x /= length;
        direction.y /= length;
      }

      // Find intersection points with polygon boundary in both directions from the line between blocks
      const lineMidpoint = {
        x: (block1Center.x + block2Center.x) / 2,
        y: (block1Center.y + block2Center.y) / 2
      };

      const point1 = findPolygonBoundaryIntersection(lineMidpoint, direction, polygonPoints);
      const point2 = findPolygonBoundaryIntersection(lineMidpoint, { x: -direction.x, y: -direction.y }, polygonPoints);

      // Store line endpoints for intersection calculation
      lineEndpoints.push({ start: point1, end: point2 });

      // Create red line from boundary to boundary, passing through both block centers
      const line = new Line([point1.x, point1.y, point2.x, point2.y], {
        stroke: '#ff0000', // Red color
        strokeWidth: 3,
        selectable: false,
        evented: false,
        strokeDashArray: [8, 4] // Dashed line for visibility
      });

      fabricCanvas.add(line);
      newLines.push(line);
    });

    // Find all intersection points between lines
    const intersectionPoints: Point[] = [];
    for (let i = 0; i < lineEndpoints.length; i++) {
      for (let j = i + 1; j < lineEndpoints.length; j++) {
        const intersection = getLineIntersection(
          lineEndpoints[i].start, lineEndpoints[i].end,
          lineEndpoints[j].start, lineEndpoints[j].end
        );
        if (intersection) {
          intersectionPoints.push(intersection);
        }
      }
    }

    // Create black dots at intersection points
    intersectionPoints.forEach(point => {
      const dot = new Circle({
        left: point.x,
        top: point.y,
        radius: 4,
        fill: '#000000', // Black color
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'center'
      });

      fabricCanvas.add(dot);
      newLines.push(dot);
    });

    setMarmaSthanLines(newLines);
    fabricCanvas.renderAll();
    console.log(`Marma Sthan: Red lines with ${intersectionPoints.length} intersection dots drawn`);
  }, [fabricCanvas, showMarmaSthan, marmaSthanLines, rotationDegree]);

  // Test feature functions - exact duplicate of 45 devtas
  const drawTestSmallPolygon = (polygonPoints: Point[], center: Point) => {
    if (!fabricCanvas) return;

    // Remove existing test small polygon
    if (testPolygon) {
      fabricCanvas.remove(testPolygon);
      setTestPolygon(null);
    }

    // Calculate scale factor for 11% area (√0.11 ≈ 0.331)
    const areaScaleFactor = 0.11;
    const linearScaleFactor = Math.sqrt(areaScaleFactor);

    console.log('Creating test small polygon with scale factor:', linearScaleFactor);
    console.log('Original polygon center:', center);
    console.log('Original polygon points:', polygonPoints);

    // Scale polygon points around the center
    const scaledPoints = polygonPoints.map(point => {
      // Translate to origin (center)
      const translatedX = point.x - center.x;
      const translatedY = point.y - center.y;
      
      // Scale
      const scaledX = translatedX * linearScaleFactor;
      const scaledY = translatedY * linearScaleFactor;
      
      // Translate back to center position
      return {
        x: scaledX + center.x,
        y: scaledY + center.y
      };
    });

    console.log('Scaled test polygon points:', scaledPoints);

    // Create smaller polygon with transparent fill and red boundary only
    const fabricPoints = scaledPoints.map(p => ({ x: p.x, y: p.y }));
    const testSmallPoly = new Polygon(fabricPoints, {
      fill: 'transparent', // No fill - transparent inside
      stroke: '#ff0000', // Red border only
      strokeWidth: 3,
      selectable: false,
      evented: false
    });

    // Add and ensure it's on top
    fabricCanvas.add(testSmallPoly);
    
    // Make sure it's rendered on top of everything except center point
    fabricCanvas.bringObjectToFront(testSmallPoly);
    
    setTestPolygon(testSmallPoly);
    fabricCanvas.renderAll();

    const smallArea = calculatePolygonArea(scaledPoints);
    const originalArea = calculatePolygonArea(polygonPoints);
    const actualPercentage = (smallArea / originalArea) * 100;
    
    console.log('Original polygon area:', originalArea);
    console.log('Test small polygon area:', smallArea);
    console.log('Actual percentage:', actualPercentage);
    
    toast.success(`Test small polygon created with ${actualPercentage.toFixed(1)}% area (${smallArea.toFixed(2)} sq units)`);
  };

  const drawTestMediumPolygon = (polygonPoints: Point[], center: Point) => {
    if (!fabricCanvas) return;

    // Remove existing test medium polygon
    if (testMediumPolygon) {
      fabricCanvas.remove(testMediumPolygon);
      setTestMediumPolygon(null);
    }

    // Calculate scale factor for 62% area (√0.62 ≈ 0.787)
    const areaScaleFactor = 0.62;
    const linearScaleFactor = Math.sqrt(areaScaleFactor);

    console.log('Creating test medium polygon with scale factor:', linearScaleFactor);

    // Position medium polygon at the same center as the main polygon and small polygon
    // This ensures equal spacing from all sides of the main polygon
    const scaledPoints = polygonPoints.map(point => {
      // Translate to origin (same center as main polygon)
      const translatedX = point.x - center.x;
      const translatedY = point.y - center.y;
      
      // Scale
      const scaledX = translatedX * linearScaleFactor;
      const scaledY = translatedY * linearScaleFactor;
      
      // Translate back to center position (same center as main polygon)
      return {
        x: scaledX + center.x,
        y: scaledY + center.y
      };
    });

    console.log('Test medium polygon points:', scaledPoints);

    // Create medium polygon with transparent fill and black boundary
    const fabricPoints = scaledPoints.map(p => ({ x: p.x, y: p.y }));
    const testMediumPoly = new Polygon(fabricPoints, {
      fill: 'transparent', // No fill - transparent inside
      stroke: '#000000', // Black border
      strokeWidth: 3,
      selectable: false,
      evented: false
    });

    // Add and ensure proper layering
    fabricCanvas.add(testMediumPoly);
    
    // Make sure it's rendered properly in the layer order
    fabricCanvas.bringObjectToFront(testMediumPoly);
    
    setTestMediumPolygon(testMediumPoly);
    fabricCanvas.renderAll();

    const mediumArea = calculatePolygonArea(scaledPoints);
    const originalArea = calculatePolygonArea(polygonPoints);
    const actualPercentage = (mediumArea / originalArea) * 100;
    
    console.log('Test medium polygon area:', mediumArea);
    console.log('Test medium actual percentage:', actualPercentage);
    
    toast.success(`Test medium polygon created with ${actualPercentage.toFixed(1)}% area (${mediumArea.toFixed(2)} sq units)`);
  };

  // Create 32 ring slices between main (outer) polygon and the medium (inner) polygon - Test version
  const drawTestRingSlices = useCallback((polygonPoints: Point[], center: Point) => {
    if (!fabricCanvas) return;

    // Recompute the inner (second layer) polygon using the same scale as drawTestMediumPolygon
    const innerScale = Math.sqrt(0.62); // ~0.787
    const innerPolygonPoints = polygonPoints.map((p) => ({
      x: center.x + (p.x - center.x) * innerScale,
      y: center.y + (p.y - center.y) * innerScale,
    }));

    const N = 32;
    const angleStep = (Math.PI * 2) / N;
    const ROTATION_OFFSET = -10; // System offset for directional alignment
    const DEVTA_ADJUSTMENT = 4; // +4 degrees clockwise rotation for test feature
    const rotationRad = ((rotationDegree + ROTATION_OFFSET + DEVTA_ADJUSTMENT) * Math.PI) / 180;
    const northOffset = -Math.PI / 2; // 0° = North (up)
    
    const outerHits: Point[] = [];
    const innerHits: Point[] = [];

    for (let i = 0; i < N; i++) {
      const a = i * angleStep + rotationRad + northOffset;
      const ho = getRayIntersectionWithPolygon(center, a, polygonPoints);
      const hi = getRayIntersectionWithPolygon(center, a, innerPolygonPoints);
      if (!ho || !hi) continue;
      outerHits.push(ho);
      innerHits.push(hi);
    }

    // Check if existing objects need updating vs creating new ones
    const expectedObjectCount = outerHits.length * 3; // slices + lines + labels
    const hasExisting = testGridLines.length >= expectedObjectCount;
    const newObjects: any[] = [];

    // Disable selection for performance while updating
    fabricCanvas.selection = false;

    for (let i = 0; i < outerHits.length; i++) {
      const j = (i + 1) % outerHits.length;
      const verts = [
        { x: innerHits[i].x, y: innerHits[i].y },
        { x: innerHits[j].x, y: innerHits[j].y },
        { x: outerHits[j].x, y: outerHits[j].y },
        { x: outerHits[i].x, y: outerHits[i].y },
      ];

      // All separator lines go from inner polygon to outer polygon (same length)
      const lineStartX = innerHits[i].x;
      const lineStartY = innerHits[i].y;
      const lineEndX = outerHits[i].x;
      const lineEndY = outerHits[i].y;

      // Label coordinates
      const sliceCenterX = (innerHits[i].x + innerHits[j].x + outerHits[i].x + outerHits[j].x) / 4;
      const sliceCenterY = (innerHits[i].y + innerHits[j].y + outerHits[i].y + outerHits[j].y) / 4;

      // Test square labels mapping
      const testSquareLabels: { [key: number]: string } = {
        33: 'N4',
        1: 'N5',
        2: 'N6',
        3: 'N7',
        4: 'N8',
        5: 'E1',
        6: 'E2',
        7: 'E3',
        8: 'E4',
        9: 'E5',
        10: 'E6',
        11: 'E7',
        12: 'E8',
        13: 'S1',
        14: 'S2',
        15: 'S3',
        16: 'S4',
        17: 'S5',
        18: 'S6',
        19: 'S7',
        20: 'S8',
        21: 'W1',
        22: 'W2',
        23: 'W3',
        24: 'W4',
        25: 'W5',
        26: 'W6',
        27: 'W7',
        28: 'W8',
        29: 'N1',
        30: 'N2',
        31: 'N3',
        32: 'N4',
      };
      
      const getSliceLabel = (index: number) => {
        const sliceNumber = index + 1;
        return testSquareLabels[sliceNumber] || sliceNumber.toString();
      };

      if (hasExisting) {
        // Update existing objects
        const sliceIndex = 3 * i;
        const lineIndex = 3 * i + 1;  
        const labelIndex = 3 * i + 2;

        if (testGridLines[sliceIndex]) {
          (testGridLines[sliceIndex] as Polygon).set({ points: verts });
        }

        if (testGridLines[lineIndex]) {
          (testGridLines[lineIndex] as Line).set({
            x1: lineStartX, y1: lineStartY, 
            x2: lineEndX, y2: lineEndY
          });
        }

        if (testGridLines[labelIndex]) {
          (testGridLines[labelIndex] as Text).set({
            left: sliceCenterX - 8,
            top: sliceCenterY - 8,
            text: getSliceLabel(i)
          });
        }
      } else {
        // Create new objects
        const slice = new Polygon(verts, {
          fill: 'transparent',
          stroke: '#000000',
          strokeWidth: 2,
          selectable: false,
          evented: false,
          objectCaching: false
        });
        fabricCanvas.add(slice);
        newObjects.push(slice);

        const sep = new Line(
          [lineStartX, lineStartY, lineEndX, lineEndY],
          {
            stroke: '#000000',
            strokeWidth: 2,
            selectable: false,
            evented: false,
            objectCaching: false
          }
        );
        fabricCanvas.add(sep);
        newObjects.push(sep);

        const numberLabel = new Text(getSliceLabel(i), {
          left: sliceCenterX - 8,
          top: sliceCenterY - 8,
          fontSize: 16,
          fill: '#000000',
          fontFamily: 'Arial',
          fontWeight: 'bold',
          selectable: false,
          evented: false,
          textAlign: 'center',
          objectCaching: false
        });
        fabricCanvas.add(numberLabel);
        newObjects.push(numberLabel);
      }
    }

    // Update existing objects or track new ones for state
    if (!hasExisting && newObjects.length > 0) {
      setTestGridLines(newObjects);
    }

    // Re-enable selection after updates
    fabricCanvas.selection = true;

    // Keep background image at back and bring our objects to front
    const bg = fabricCanvas.getObjects().find(o => o instanceof FabricImage) as FabricImage | undefined;
    if (bg) fabricCanvas.sendObjectToBack(bg);
    newObjects.forEach(obj => fabricCanvas.bringObjectToFront(obj));

    fabricCanvas.renderAll();
  }, [fabricCanvas, testGridLines, rotationDegree]);

  // Helper function to find the center point of a region between two polygons
  const findRegionCenterBetweenPolygons = (center: Point, angle: number, innerPoly: Point[], outerPoly: Point[]): Point => {
    const innerPoint = getRayIntersectionWithPolygon(center, angle, innerPoly);
    const outerPoint = getRayIntersectionWithPolygon(center, angle, outerPoly);
    
    if (!innerPoint || !outerPoint) return center;
    
    // Return point at 50% distance between inner and outer boundaries
    return {
      x: innerPoint.x + (outerPoint.x - innerPoint.x) * 0.5,
      y: innerPoint.y + (outerPoint.y - innerPoint.y) * 0.5
    };
  };

  const toggleTest = () => {
    if (!fabricCanvas) return;
    
    const newShowTest = !showTest;
    setShowTest(newShowTest);
    
    if (newShowTest) {
      // Recreate all test features to ensure proper display
      if (completedPolygonPoints.length >= 3) {
        const center = calculatePolygonCenterLocal(completedPolygonPoints);
        console.log('Drawing test features with center:', center);
        
        // Recreate medium polygon and ring slices (no red polygon)
        drawTestMediumPolygon(completedPolygonPoints, center);
        drawTestRingSlices(completedPolygonPoints, center);
      }
    } else {
      // Properly remove all test objects instead of just hiding them
      if (testPolygon) {
        fabricCanvas.remove(testPolygon);
        setTestPolygon(null);
      }
      if (testMediumPolygon) {
        fabricCanvas.remove(testMediumPolygon);
        setTestMediumPolygon(null);
      }
      
      // Remove all test grid lines and devta zones
      testGridLines.forEach(line => {
        if (fabricCanvas.contains(line)) {
          fabricCanvas.remove(line);
        }
      });
      setTestGridLines([]);
    }
    
    fabricCanvas.renderAll();
    console.log("Test feature toggled:", newShowTest, "Canvas objects:", fabricCanvas.getObjects().length);
    toast.success(`Test feature ${newShowTest ? 'enabled' : 'disabled'}`);
  };

  // Helper function to find intersection point of a ray with polygon boundary
  const findPolygonBoundaryIntersection = (center: Point, direction: Point, polygon: Point[]): Point => {
    let closestDistance = Infinity;
    let closestPoint = center;
    
    // Cast ray from center in the given direction and find where it intersects polygon boundary
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      const p1 = polygon[i];
      const p2 = polygon[j];
      
      // Calculate intersection of ray with polygon edge
      const intersection = rayLineIntersection(center, direction, p1, p2);
      if (intersection) {
        const distance = Math.sqrt(
          Math.pow(intersection.x - center.x, 2) + Math.pow(intersection.y - center.y, 2)
        );
        // Use closest intersection point to stay within boundary
        if (distance > 0 && distance < closestDistance) {
          closestDistance = distance;
          closestPoint = intersection;
        }
      }
    }
    
    return closestPoint;
  };

  // Draw 32 entrances 81 pad - copy 45 Devtas ring-slice mechanic (no red polygon shown)
  const draw32Entrances = useCallback((polygonPoints: Point[], center: Point) => {
    console.log('[32 Entrances] draw called. pts=', polygonPoints.length, 'center=', center);
    if (!fabricCanvas) return;

    // Remove previously tracked entrance objects
    if (entranceLines.length > 0) {
      entranceLines.forEach(obj => fabricCanvas.contains(obj) && fabricCanvas.remove(obj));
    }

    // Inner ring uses same scale as 45 Devtas medium polygon (62% area)
    const innerScale = Math.sqrt(0.62);
    const innerPolygonPoints = polygonPoints.map(p => ({
      x: center.x + (p.x - center.x) * innerScale,
      y: center.y + (p.y - center.y) * innerScale,
    }));

    const N = 32;
    const angleStep = (Math.PI * 2) / N;
    const ROTATION_OFFSET = -10; // keep system baseline
    const DEVTA_ADJUSTMENT = 4;  // align with 45 Devtas baseline
    const rotationRad = ((rotationDegree + ROTATION_OFFSET + DEVTA_ADJUSTMENT) * Math.PI) / 180;
    const northOffset = -Math.PI / 2;

    const outerHits: Point[] = [];
    const innerHits: Point[] = [];

    for (let i = 0; i < N; i++) {
      const a = i * angleStep + rotationRad + northOffset;
      const ho = getRayIntersectionWithPolygon(center, a, polygonPoints);
      const hi = getRayIntersectionWithPolygon(center, a, innerPolygonPoints);
      if (!ho || !hi) continue;
      outerHits.push(ho);
      innerHits.push(hi);
    }

    const newObjs: any[] = [];

    // Build slices + separator lines + labels (exact structure used by 45 Devtas)
    for (let i = 0; i < outerHits.length; i++) {
      const j = (i + 1) % outerHits.length;
      const verts = [
        { x: innerHits[i].x, y: innerHits[i].y },
        { x: innerHits[j].x, y: innerHits[j].y },
        { x: outerHits[j].x, y: outerHits[j].y },
        { x: outerHits[i].x, y: outerHits[i].y },
      ];

      // Slice polygon (transparent fill, black edge)
      const slice = new Polygon(verts, {
        fill: 'transparent',
        stroke: '#000000',
        strokeWidth: 2,
        selectable: false,
        evented: false,
        objectCaching: false,
      });
      fabricCanvas.add(slice);
      newObjs.push(slice);

      // Separator radial line (from inner ring to outer boundary)
      const sep = new Line([
        innerHits[i].x, innerHits[i].y,
        outerHits[i].x, outerHits[i].y,
      ], {
        stroke: '#000000',
        strokeWidth: 2,
        selectable: false,
        evented: false,
        objectCaching: false,
      });
      fabricCanvas.add(sep);
      newObjs.push(sep);

      // Center of slice for label
      const cx = (innerHits[i].x + innerHits[j].x + outerHits[i].x + outerHits[j].x) / 4;
      const cy = (innerHits[i].y + innerHits[j].y + outerHits[i].y + outerHits[j].y) / 4;

      const label = new Text(String(i + 1), {
        left: cx - 8,
        top: cy - 8,
        fontSize: 16,
        fill: '#000000',
        fontFamily: 'Arial',
        fontWeight: 'bold',
        selectable: false,
        evented: false,
        textAlign: 'center',
        objectCaching: false,
      });
      fabricCanvas.add(label);
      newObjs.push(label);
    }

    setEntranceLines(newObjs);

    // Keep background image at back and bring our objects to front
    const bg = fabricCanvas.getObjects().find(o => o instanceof FabricImage) as FabricImage | undefined;
    if (bg) fabricCanvas.sendObjectToBack(bg);
    newObjs.forEach(obj => fabricCanvas.bringObjectToFront(obj));

    fabricCanvas.renderAll();
  }, [fabricCanvas, entranceLines, rotationDegree]);

  // Helper function to calculate intersection of ray with line segment
  const rayLineIntersection = (rayStart: Point, rayDirection: Point, lineStart: Point, lineEnd: Point): Point | null => {
    const dx1 = rayDirection.x;
    const dy1 = rayDirection.y;
    const dx2 = lineEnd.x - lineStart.x;
    const dy2 = lineEnd.y - lineStart.y;
    
    const denominator = dx1 * dy2 - dy1 * dx2;
    if (Math.abs(denominator) < 1e-10) return null; // Parallel lines
    
    const dx3 = rayStart.x - lineStart.x;
    const dy3 = rayStart.y - lineStart.y;
    
    const t1 = (dx2 * dy3 - dy2 * dx3) / denominator;
    const t2 = (dx1 * dy3 - dy1 * dx3) / denominator;
    
    // Check if intersection is on line segment and in ray direction
    if (t1 >= 0 && t2 >= 0 && t2 <= 1) {
      return {
        x: rayStart.x + t1 * dx1,
        y: rayStart.y + t1 * dy1
      };
    }
    
    return null;
  };
  // Clear 32 entrances lines
  const clear32EntranceLines = () => {
    if (!fabricCanvas) return;
    
    entranceLines.forEach(line => {
      if (fabricCanvas.contains(line)) {
        fabricCanvas.remove(line);
      }
    });
    setEntranceLines([]);
  };

  // Toggle 32 entrances visibility
  const toggle32Entrances = (newShow32Entrances: boolean) => {
    console.log('[32 Entrances] toggle ->', newShow32Entrances, {
      hasCanvas: !!fabricCanvas,
      completedPts: completedPolygonPoints.length,
    });
    setShow32Entrances(newShow32Entrances);
    
    if (!newShow32Entrances) {
      clear32EntranceLines();
    } else if (completedPolygonPoints.length >= 3) {
      const center = calculatePolygonCenterLocal(completedPolygonPoints);
      console.log('[32 Entrances] drawing after toggle. center=', center);
      draw32Entrances(completedPolygonPoints, center);
    }

    toast.success(`32 Entrances ${newShow32Entrances ? 'enabled' : 'disabled'}`);
  };

  // Toggle Marma Sthan visibility
  const toggleMarmaSthan = (newShowMarmaSthan: boolean) => {
    setShowMarmaSthan(newShowMarmaSthan);
    
    if (!newShowMarmaSthan) {
      clearMarmaSthanLine();
    } else if (completedPolygonPoints.length >= 3) {
      const center = calculatePolygonCenterLocal(completedPolygonPoints);
      drawMarmaSthan(completedPolygonPoints, center);
    }

    toast.success(`Marma Sthan ${newShowMarmaSthan ? 'enabled' : 'disabled'}`);
  };

  // Smooth updates for Marma Sthan rotation
  useEffect(() => {
    if (showMarmaSthan && currentPolygon && completedPolygonPoints.length >= 3 && fabricCanvas) {
      const center = calculatePolygonCenterLocal(completedPolygonPoints);
      drawMarmaSthan(completedPolygonPoints, center);
    }
  }, [rotationDegree, showMarmaSthan, currentPolygon, completedPolygonPoints, fabricCanvas, drawMarmaSthan]);

  // Smooth updates for 32 entrances rotation
  useEffect(() => {
    if (show32Entrances && currentPolygon && completedPolygonPoints.length >= 3 && fabricCanvas) {
      const center = calculatePolygonCenterLocal(completedPolygonPoints);
      draw32Entrances(completedPolygonPoints, center);
    }
  }, [rotationDegree, show32Entrances, currentPolygon, completedPolygonPoints, fabricCanvas, draw32Entrances]);

  // Smooth updates for 45 devtas rotation
  useEffect(() => {
    if (showDevtas && currentPolygon && completedPolygonPoints.length >= 3 && fabricCanvas) {
      const center = calculatePolygonCenterLocal(completedPolygonPoints);
      drawRingSlices(completedPolygonPoints, center);
    }
  }, [rotationDegree, showDevtas, currentPolygon, completedPolygonPoints, fabricCanvas]);

  // Smooth updates for test feature rotation
  useEffect(() => {
    if (showTest && currentPolygon && completedPolygonPoints.length >= 3 && fabricCanvas) {
      const center = calculatePolygonCenterLocal(completedPolygonPoints);
      drawTestRingSlices(completedPolygonPoints, center);
    }
  }, [rotationDegree, showTest, currentPolygon, completedPolygonPoints, fabricCanvas]);


  // Smooth updates for vithi mandal rotation
  useEffect(() => {
    if (showVithiMandal && currentPolygon && completedPolygonPoints.length >= 3 && fabricCanvas) {
      const center = calculatePolygonCenterLocal(completedPolygonPoints);
      drawVithiMandalPolygons(completedPolygonPoints, center);
    }
  }, [rotationDegree, showVithiMandal, currentPolygon, completedPolygonPoints, fabricCanvas]);

  const clearDevtaZones = () => {
    if (!fabricCanvas) return;
    
    devtaZones.forEach(zone => {
      fabricCanvas.remove(zone);
    });
    setDevtaZones([]);
  };

  const startDrawing = () => {
    setIsDrawing(true);
    setPolygonPoints([]);
    if (currentPolygon && fabricCanvas) {
      fabricCanvas.remove(currentPolygon);
      setCurrentPolygon(null);
    }
    if (centerPoint && fabricCanvas) {
      fabricCanvas.remove(centerPoint);
      setCenterPoint(null);
    }
    if (smallPolygon && fabricCanvas) {
      fabricCanvas.remove(smallPolygon);
      setSmallPolygon(null);
    }
    if (mediumPolygon && fabricCanvas) {
      fabricCanvas.remove(mediumPolygon);
      setMediumPolygon(null);
    }
    clearDevtaZones();
    clearDirectionLines();
    clearGateLines();
    clear32EntranceLines();
    setCompletedPolygonPoints([]);
    toast.info("Click to add polygon points. Use the Finish button when you have 3+ points.");
  };

  const finishPolygon = () => {
    if (polygonPoints.length >= 3) {
      completePolygon(polygonPoints);
    } else {
      toast.error("Need at least 3 points to finish polygon!");
    }
  };


  const toggleDevtasVisibility = () => {
    if (!fabricCanvas) return;
    
    const newShowDevtas = !showDevtas;
    setShowDevtas(newShowDevtas);
    
    console.log('Toggle devtas:', newShowDevtas, 'Completed polygon points:', completedPolygonPoints.length);
    
    if (newShowDevtas) {
      // Recreate all devta features to ensure proper display
      if (completedPolygonPoints.length >= 3) {
        const center = calculatePolygonCenterLocal(completedPolygonPoints);
        console.log('Drawing devta features with center:', center);
        
        // Recreate small and medium polygons
        drawSmallPolygon(completedPolygonPoints, center);
        drawMediumPolygon(completedPolygonPoints, center);
        
        // Recreate ring slices with all special extended lines
        drawRingSlices(completedPolygonPoints, center);
      }
    } else {
      // Properly remove all devta objects instead of just hiding them
      if (smallPolygon) {
        fabricCanvas.remove(smallPolygon);
        setSmallPolygon(null);
      }
      if (mediumPolygon) {
        fabricCanvas.remove(mediumPolygon);
        setMediumPolygon(null);
      }
      // Remove all grid lines (radial lines and numbers) instead of hiding them
      gridLines.forEach(line => {
        if (fabricCanvas.contains(line)) {
          fabricCanvas.remove(line);
        }
      });
      setGridLines([]);
      
      // Also clear any devta zones
      clearDevtaZones();
    }
    
    fabricCanvas.renderAll();
    console.log("45 devtas toggled:", newShowDevtas, "Canvas objects:", fabricCanvas.getObjects().length);
    toast.success(`45 devtas ${newShowDevtas ? 'enabled' : 'disabled'}`);
  };

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    
    setIsDrawing(false);
    setPolygonPoints([]);
    setPolygonHistory([]);
    setHistoryIndex(-1);
    
    // Remove all objects except the background image
    const allObjects = fabricCanvas.getObjects();
    const objectsToRemove = allObjects.filter(obj => !(obj instanceof FabricImage));
    
    objectsToRemove.forEach(obj => {
      fabricCanvas.remove(obj);
    });
    
    // Reset all polygon-related states
    setCurrentPolygon(null);
    setCenterPoint(null);
    setSmallPolygon(null);
    setMediumPolygon(null);
    setTestPolygon(null);
    setTestMediumPolygon(null);
    
    // Clear all feature arrays
    clearGrid();
    clearDevtaZones();
    clearDirectionLines();
    clearGateLines();
    clear32EntranceLines();
    clearVithiMandalPolygons();
    clearMarmaSthanLine();
    setCompletedPolygonPoints([]);
    setTestGridLines([]);
    setDevtaSlices([]);
    setEntranceLines([]);
    setMarmaSthanLines([]);
    
    fabricCanvas.renderAll();
    onPolygonChange?.([], 0, { x: 0, y: 0 });
    toast.success("Canvas cleared!");
  };

  const undoLastPoint = () => {
    if (!isDrawing || !fabricCanvas || historyIndex <= 0) return;
    
    try {
      const newIndex = historyIndex - 1;
      const previousPoints = polygonHistory[newIndex] || [];
      
      // Remove all point markers and current polygon
      removeAllPointMarkers();
      
      // Update state
      setPolygonPoints(previousPoints);
      setHistoryIndex(newIndex);
      
      // Redraw points and polygon
      if (previousPoints.length > 0) {
        redrawPointsAndPolygon(previousPoints);
      }
      
      toast.success("Undid last point");
    } catch (error) {
      console.error("Error in undoLastPoint:", error);
      toast.error("Failed to undo last point");
    }
  };

  const redoLastPoint = () => {
    if (!isDrawing || !fabricCanvas || historyIndex >= polygonHistory.length - 1) return;
    
    try {
      const newIndex = historyIndex + 1;
      const nextPoints = polygonHistory[newIndex] || [];
      
      // Remove all point markers and current polygon
      removeAllPointMarkers();
      
      // Update state
      setPolygonPoints(nextPoints);
      setHistoryIndex(newIndex);
      
      // Redraw points and polygon
      if (nextPoints.length > 0) {
        redrawPointsAndPolygon(nextPoints);
      }
      
      toast.success("Redid last point");
    } catch (error) {
      console.error("Error in redoLastPoint:", error);
      toast.error("Failed to redo last point");
    }
  };

  const removeAllPointMarkers = () => {
    if (!fabricCanvas) return;
    
    try {
      const allObjects = fabricCanvas.getObjects();
      const markersToRemove = [];
      
      // Find point markers and polygons/polylines
      allObjects.forEach(obj => {
        // Point markers (circles with radius 10)
        if (obj instanceof Circle && obj.radius === 10) {
          markersToRemove.push(obj);
        }
        // Point number labels (text with fontSize 14)
        else if (obj instanceof Text && obj.fontSize === 14) {
          markersToRemove.push(obj);
        }
        // Temporary polygons/polylines (not the final completed ones)
        else if ((obj instanceof Polyline || obj instanceof Polygon) && 
                 obj !== smallPolygon && obj !== mediumPolygon && obj !== testPolygon && obj !== testMediumPolygon) {
          // Only remove if it's a temporary drawing polygon
          if (obj.stroke === '#2563eb' && !obj.fill) {
            markersToRemove.push(obj);
          } else if (obj.stroke === '#2563eb' && obj.fill === '') {
            markersToRemove.push(obj);
          }
        }
      });
      
      // Remove identified markers
      markersToRemove.forEach(marker => {
        fabricCanvas.remove(marker);
      });
      
      // Remove current polygon/polyline reference
      if (currentPolygon) {
        // Only remove if it's not already removed
        if (fabricCanvas.getObjects().includes(currentPolygon)) {
          fabricCanvas.remove(currentPolygon);
        }
        setCurrentPolygon(null);
      }
    } catch (error) {
      console.error("Error in removeAllPointMarkers:", error);
    }
  };

  const redrawPointsAndPolygon = (points: Point[]) => {
    if (!fabricCanvas || !points || points.length === 0) return;
    
    try {
      // Redraw point markers
      points.forEach((point, index) => {
        if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
          console.warn("Invalid point data:", point);
          return;
        }
        
        const circle = new Circle({
          radius: 10,
          fill: '#2563eb',
          stroke: '#ffffff',
          strokeWidth: 2,
          left: point.x - 10,
          top: point.y - 10,
          selectable: false,
          evented: false,
        });

        const text = new Text((index + 1).toString(), {
          left: point.x - 4.5,
          top: point.y - 7,
          fontSize: 14,
          fill: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
          selectable: false,
          evented: false,
        });

        fabricCanvas.add(circle);
        fabricCanvas.add(text);
      });
      
      // Redraw polygon/polyline
      drawTemporaryPolygon(points);
      fabricCanvas.renderAll();
    } catch (error) {
      console.error("Error in redrawPointsAndPolygon:", error);
    }
  };

  const exportCanvas = () => {
    if (!fabricCanvas) {
      toast.error("No canvas to export");
      return;
    }

    try {
      // Generate timestamp for unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `area-calculator-export-${timestamp}.png`;

      // Export canvas as high-quality PNG
      const dataURL = fabricCanvas.toDataURL({
        format: 'png',
        quality: 1.0,
        multiplier: 2, // 2x resolution for better quality
      });

      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Canvas exported as ${filename}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error("Failed to export canvas");
    }
  };

  const exportPDFReport = async () => {
    if (!fabricCanvas || !currentPolygon) {
      return;
    }
    
    // Show dialog to collect user details
    setShowPDFDialog(true);
  };

  const generatePDFWithDetails = async (userDetails: typeof pdfUserDetails) => {
    if (!fabricCanvas || !currentPolygon) {
      toast.error("No polygon data to export");
      return;
    }

    try {
      toast.info("Generating PDF report...");
      
      // Create a new PDF document with A4 dimensions
      const pdf = new jsPDF('portrait', 'mm', 'a4'); // Standard A4 size (210x297mm)
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pdfMargin = 10;
      const pdfTopOffset = 22;
      
      // Store current visibility states - includes ALL toggle states for proper restoration
      const currentStates = {
        showDevtas,
        show16Directions,
        show32Gates,
        
        show16BarChart,
        showVithiMandal,
        show45Devtas,
        showMarmaSthan
      };

      // Helper function to add user details to the bottom-right corner of each page
      const addUserDetailsToPage = (pdf: jsPDF, userDetails: typeof pdfUserDetails) => {
        if (!userDetails.name && !userDetails.phone && !userDetails.address) return;
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0); // Black color
        
        // Position details to be clearly visible on white portion only
        let yPosition = pageHeight - 80; // Move further from edge
        const xPosition = pageWidth - 15; // Slightly more padding from edge
        
        if (userDetails.name.trim()) {
          pdf.text(userDetails.name, xPosition, yPosition, { align: 'right' });
          yPosition += 10; // Reduced spacing
        }
        
        if (userDetails.phone.trim()) {
          pdf.text(userDetails.phone, xPosition, yPosition, { align: 'right' });
          yPosition += 10; // Reduced spacing
        }
        
        if (userDetails.address.trim()) {
          // Split address if too long
          const maxWidth = 50;
          const addressLines = pdf.splitTextToSize(userDetails.address, maxWidth);
          addressLines.forEach((line: string) => {
            pdf.text(line, xPosition, yPosition, { align: 'right' });
            yPosition += 10; // Reduced spacing
          });
        }
        
        pdf.setTextColor(0, 0, 0); // Reset to black
      };

      // Helper function to capture canvas state
      const captureCanvasState = async (_title: string, targetAspect?: number): Promise<string> => {
        // Allow canvas to render fully
        await new Promise(resolve => setTimeout(resolve, 200));

        // Compute tight bounding box around visible objects to avoid extra whitespace
        const objects = fabricCanvas.getObjects();
        let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
        objects.forEach((obj: any) => {
          if (!obj?.visible) return;
          const rect = obj.getBoundingRect ? obj.getBoundingRect() : {
            left: obj.left || 0,
            top: obj.top || 0,
            width: (obj.width || 0) * (obj.scaleX || 1),
            height: (obj.height || 0) * (obj.scaleY || 1)
          };
          left = Math.min(left, rect.left);
          top = Math.min(top, rect.top);
          right = Math.max(right, rect.left + rect.width);
          bottom = Math.max(bottom, rect.top + rect.height);
        });

        // Fallback to full canvas if bounds invalid
        if (!isFinite(left) || !isFinite(top) || right <= left || bottom <= top) {
          return fabricCanvas.toDataURL({ format: 'png', quality: 1.0, multiplier: 2 });
        }

        // Base padding around content (canvas pixels at scale 1)
        const padH = 8;
        const padV = 14; // more vertical padding to help height utilization
        let cropLeft = Math.max(0, left - padH);
        let cropTop = Math.max(0, top - padV);
        let cropRight = Math.min(fabricCanvas.width || 0, right + padH);
        let cropBottom = Math.min(fabricCanvas.height || 0, bottom + padV);

        // Aggressively expand to match targetAspect for better page utilization
        if (targetAspect && isFinite(targetAspect) && targetAspect > 0) {
          const curW = cropRight - cropLeft;
          let curH = cropBottom - cropTop;
          const currentAspect = curW / curH;
          
          // Always try to match target aspect more closely
          const desiredH = curW / targetAspect;
          const extra = Math.max(0, (desiredH - curH) / 2);
          
          // Expand vertically as much as possible within canvas bounds
          cropTop = Math.max(0, cropTop - extra * 1.5); // More aggressive expansion
          cropBottom = Math.min((fabricCanvas.height || 0), cropBottom + extra * 1.5);
          
          // If still not enough height, also try expanding width slightly
          const newH = cropBottom - cropTop;
          if (newH < desiredH * 0.8) { // If we couldn't get enough height
            const newDesiredW = newH * targetAspect;
            const widthExtra = Math.max(0, (newDesiredW - curW) / 2);
            cropLeft = Math.max(0, cropLeft - widthExtra);
            cropRight = Math.min((fabricCanvas.width || 0), cropRight + widthExtra);
          }
        }

        const cropWidth = Math.max(1, cropRight - cropLeft);
        const cropHeight = Math.max(1, cropBottom - cropTop);

        // Render source at higher resolution, then crop to tight area
        const srcMultiplier = 2;
        const srcUrl = fabricCanvas.toDataURL({ format: 'png', quality: 1.0, multiplier: srcMultiplier });

        const img: HTMLImageElement = await new Promise((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = reject;
          i.crossOrigin = 'anonymous';
          i.src = srcUrl;
        });

        const out = document.createElement('canvas');
        out.width = Math.floor(cropWidth * srcMultiplier);
        out.height = Math.floor(cropHeight * srcMultiplier);
        const ctx = out.getContext('2d')!;
        ctx.drawImage(
          img,
          cropLeft * srcMultiplier,
          cropTop * srcMultiplier,
          cropWidth * srcMultiplier,
          cropHeight * srcMultiplier,
          0,
          0,
          out.width,
          out.height
        );

        // Store captured dimensions for PDF sizing
        out.setAttribute('data-crop-width', cropWidth.toString());
        out.setAttribute('data-crop-height', cropHeight.toString());
        
        return out.toDataURL('image/png');
      };

      // Helper function to reset all features with proper cleanup

      // Helper function to reset all features with proper cleanup
      const resetAllFeatures = async () => {
        console.log('Starting reset of all features...');
        
        // Use toggle functions to properly turn off each feature
        if (showDevtas) toggleDevtasVisibility();
        if (show16Directions) toggle16Directions();
        if (show32Gates) toggle32Gates();
        
        if (showVithiMandal) toggleVithiMandal();
        if (showMarmaSthan) toggleMarmaSthan(false);
        if (show16BarChart) setShow16BarChart(false);
        
        // Wait for toggle operations to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Clear all canvas objects except main elements
        const objectsToRemove = fabricCanvas.getObjects().filter(obj => {
          // Keep the main polygon, background image, and center point
          return !(obj === currentPolygon || 
                   obj instanceof FabricImage || 
                   obj === centerPoint);
        });
        
        objectsToRemove.forEach(obj => {
          fabricCanvas.remove(obj);
        });
        
        // Force reset all state variables to false - ensures no toggles are open during capture
        setShowDevtas(false);
        setShow16Directions(false);  
        setShow32Gates(false);
        setShowVithiMandal(false);
        
        
        // Clear all tracked object arrays
        setSmallPolygon(null);
        setMediumPolygon(null);
        setGridLines([]);
        setDirectionLines([]);
        setGateLines([]);
        setMarmaSthanLines([]);
        
        // Explicit cleanup calls
        clearVithiMandalPolygons();
        clearDevtaZones();
        clearMarmaSthanLine();
        
        // Ensure background image stays at the back
        const backgroundImage = fabricCanvas.getObjects().find(obj => obj instanceof FabricImage);
        if (backgroundImage) {
          fabricCanvas.sendObjectToBack(backgroundImage);
        }
        
        fabricCanvas.renderAll();
        console.log('Reset complete, canvas objects:', fabricCanvas.getObjects().length);
        await new Promise(resolve => setTimeout(resolve, 300));
      };

      // Helper function to ensure background image stays at the back
      const ensureImageAtBack = () => {
        const backgroundImage = fabricCanvas.getObjects().find(obj => obj instanceof FabricImage);
        if (backgroundImage) {
          fabricCanvas.sendObjectToBack(backgroundImage);
        }
      };

      // Helper function to create a beautiful cover page
      const createCoverPage = async (pdf: jsPDF, userDetails: typeof pdfUserDetails) => {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        // Background gradient effect using overlapping rectangles
        pdf.setFillColor(255, 248, 220); // Cornsilk background
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        
        // Top decorative border with gradient
        pdf.setFillColor(220, 20, 60); // Crimson
        pdf.rect(0, 0, pageWidth, 15, 'F');
        pdf.setFillColor(255, 140, 0); // Dark orange
        pdf.rect(0, 15, pageWidth, 8, 'F');
        pdf.setFillColor(255, 215, 0); // Gold
        pdf.rect(0, 23, pageWidth, 5, 'F');
        
        // Bottom decorative border
        pdf.setFillColor(255, 215, 0); // Gold
        pdf.rect(0, pageHeight - 28, pageWidth, 5, 'F');
        pdf.setFillColor(255, 140, 0); // Dark orange
        pdf.rect(0, pageHeight - 23, pageWidth, 8, 'F');
        pdf.setFillColor(220, 20, 60); // Crimson
        pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
        
        // Side decorative borders
        pdf.setFillColor(139, 69, 19); // Saddle brown
        pdf.rect(0, 28, 5, pageHeight - 56, 'F');
        pdf.rect(pageWidth - 5, 28, 5, pageHeight - 56, 'F');
        
        // Load and add the Om symbol image (smaller)
        const centerX = pageWidth / 2;
        const centerY = 50; // Move up
        
        try {
          // Load the Om symbol image as base64
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          const loadImage = (): Promise<string> => {
            return new Promise((resolve, reject) => {
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d')!;
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
              };
              img.onerror = () => {
                // Fallback to text if image fails to load
                reject(new Error('Image failed to load'));
              };
              img.src = '/om-symbol.png';
            });
          };
          
          try {
            const omImageData = await loadImage();
            const omImageWidth = 60; // Smaller
            const omImageHeight = 30; // Smaller
            const omImageX = centerX - omImageWidth / 2;
            const omImageY = centerY - omImageHeight / 2;
            pdf.addImage(omImageData, 'PNG', omImageX, omImageY, omImageWidth, omImageHeight);
          } catch (error) {
            // Fallback to text Om symbol if image loading fails
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(139, 69, 19);
            pdf.setFontSize(30); // Smaller
            pdf.text('ॐ', centerX, centerY + 6, { align: 'center' });
          }
        } catch (error) {
          // Fallback to text Om symbol
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(139, 69, 19);
          pdf.setFontSize(30); // Smaller
          pdf.text('ॐ', centerX, centerY + 6, { align: 'center' });
        }
        
        // Main title (smaller and repositioned)
        pdf.setTextColor(139, 69, 19); // Saddle brown
        pdf.setFontSize(22); // Smaller
        pdf.text('VASTU CONSULTATION', centerX, 90, { align: 'center' }); // Move up
        pdf.setFontSize(18); // Smaller
        pdf.text('REPORT', centerX, 105, { align: 'center' }); // Move up
        
        // Decorative line under title
        pdf.setDrawColor(220, 20, 60); // Crimson
        pdf.setLineWidth(1);
        pdf.line(centerX - 30, 115, centerX + 30, 115); // Move up and make shorter
        
        // English Vastu Shastra quote without background rectangle
        pdf.setTextColor(139, 69, 19); // Saddle brown text (visible on cream background)
        pdf.setFontSize(14);
        pdf.text('Where there is happiness and harmony in living,', centerX, 150, { align: 'center' });
        pdf.text('there itself lies the essence of Vastu Shastra', centerX, 170, { align: 'center' });
        pdf.setTextColor(0, 0, 0); // Reset to black
        
        // User details section with decorative frame (repositioned after black rectangle)
        if (userDetails.name || userDetails.phone || userDetails.address) {
          // Decorative box for user details (positioned after black rectangle)
          const boxY = 200; // Moved down after black rectangle
          const boxHeight = 80; // Increased from 50 to 80
          
          pdf.setFillColor(255, 248, 220); // Cornsilk
          pdf.setDrawColor(139, 69, 19); // Saddle brown
          pdf.setLineWidth(1.5); // Thinner
          pdf.roundedRect(40, boxY, pageWidth - 80, boxHeight, 3, 3, 'FD'); // Same margins but taller
          
          // Inner decorative border
          pdf.setDrawColor(220, 20, 60); // Crimson
          pdf.setLineWidth(0.3); // Thinner
          pdf.roundedRect(43, boxY + 3, pageWidth - 86, boxHeight - 6, 2, 2, 'D');
          
          pdf.setTextColor(139, 69, 19); // Saddle brown
          pdf.setFontSize(16); // Increased from 11 to 16
          pdf.text('Prepared By:', centerX, boxY + 18, { align: 'center' });
          
          let yPos = boxY + 35; // Start lower in the box
          pdf.setFontSize(14); // Increased from 9 to 14
          const lineSpacing = 10; // Increased spacing from 6 to 10
          
          if (userDetails.name.trim()) {
            pdf.setTextColor(220, 20, 60); // Crimson
            const nameText = `Name: ${userDetails.name}`;
            const nameLines = pdf.splitTextToSize(nameText, pageWidth - 100);
            nameLines.forEach((line: string, index: number) => {
              if (yPos + (index * lineSpacing) < boxY + boxHeight - 5) {
                pdf.text(line, centerX, yPos + (index * lineSpacing), { align: 'center' });
              }
            });
            yPos += nameLines.length * lineSpacing;
          }
          
          if (userDetails.phone.trim() && yPos < boxY + boxHeight - 15) {
            pdf.setTextColor(255, 140, 0); // Dark orange
            pdf.text(`Phone: ${userDetails.phone}`, centerX, yPos, { align: 'center' });
            yPos += lineSpacing;
          }
          
          if (userDetails.address.trim() && yPos < boxY + boxHeight - 15) {
            pdf.setTextColor(139, 69, 19); // Saddle brown
            const addressText = `Address: ${userDetails.address}`;
            const addressLines = pdf.splitTextToSize(addressText, pageWidth - 100);
            addressLines.forEach((line: string, index: number) => {
              if (yPos + (index * lineSpacing) < boxY + boxHeight - 3) {
                pdf.text(line, centerX, yPos + (index * lineSpacing), { align: 'center' });
              }
            });
          }
        }
        
        // English Vastu Shastra quote centered in available space (removed as it's now in black rectangle)
        // Quote is now displayed in the black rectangle above
        
        // Clean bottom section - only date (smaller and repositioned)
        const currentDate = new Date().toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        pdf.setTextColor(139, 69, 19);
        pdf.setFontSize(9); // Smaller
        pdf.text(`Report Generated: ${currentDate}`, centerX, pageHeight - 25, { align: 'center' }); // Move up
      };

      // Reset all features first
      await resetAllFeatures();

      // Create beautiful cover page as first page
      await createCoverPage(pdf, userDetails);
      
      // Add new page for content
      pdf.addPage();

      // Page 1: 16 Directions (reset first, then enable only this)
      console.log('Capturing Page 1: 16 Directions');
      setShow16Directions(true);
      if (completedPolygonPoints.length >= 3) {
        const center = calculatePolygonCenterLocal(completedPolygonPoints);
        draw16Directions(completedPolygonPoints, center);
      }
      ensureImageAtBack();
      await new Promise(resolve => setTimeout(resolve, 500));

      const dirAvailableWidth = pageWidth - pdfMargin * 2;
      const dirAvailableHeight = pageHeight - pdfTopOffset - pdfMargin;
      const dirTargetAspect = dirAvailableWidth / dirAvailableHeight;
      const directionImage = await captureCanvasState("16 Directions", dirTargetAspect);
      
      pdf.setFontSize(16);
      pdf.text("Page 1: 16 Direction Analysis", pageWidth / 2, 20, { align: 'center' });
      // Use captured image dimensions for better height utilization
      let dirFinalWidth = dirAvailableWidth;
      let dirFinalHeight = dirAvailableHeight * 0.9;
      
      const tempDirImg = new Image();
      tempDirImg.src = directionImage;
      await new Promise(resolve => tempDirImg.onload = resolve);
      
      const dirCapturedAspect = tempDirImg.width / tempDirImg.height;
      
      if (dirFinalWidth / dirFinalHeight > dirCapturedAspect) {
        dirFinalWidth = dirFinalHeight * dirCapturedAspect;
      } else {
        dirFinalHeight = dirFinalWidth / dirCapturedAspect;
      }
      const dirX = (pageWidth - dirFinalWidth) / 2;
      const dirY = pdfTopOffset + 6;
      pdf.addImage(directionImage, 'PNG', dirX, dirY, dirFinalWidth, dirFinalHeight);
      
      // Add user details to page
      addUserDetailsToPage(pdf, userDetails);

      // Page 2: 32 Gates (reset first, then enable only this)
      pdf.addPage();
      console.log('Capturing Page 2: 32 Gates');
      await resetAllFeatures();
      setShow32Gates(true);
      if (completedPolygonPoints.length >= 3) {
        const center = calculatePolygonCenterLocal(completedPolygonPoints);
        draw32Gates(completedPolygonPoints, center);
      }
      ensureImageAtBack();
      await new Promise(resolve => setTimeout(resolve, 500));
      const gatesAvailableWidth = pageWidth - pdfMargin * 2;
      const gatesAvailableHeight = pageHeight - pdfTopOffset - pdfMargin;
      const gatesTargetAspect = gatesAvailableWidth / gatesAvailableHeight;
      const gatesImage = await captureCanvasState("32 Gates", gatesTargetAspect);
      
      pdf.setFontSize(16);
      pdf.text("Page 2: 32 Gates Layout", pageWidth / 2, 20, { align: 'center' });
      // Use captured image dimensions for better height utilization  
      let gatesFinalWidth = gatesAvailableWidth;
      let gatesFinalHeight = gatesAvailableHeight * 0.9;
      
      const tempGatesImg = new Image();
      tempGatesImg.src = gatesImage;
      await new Promise(resolve => tempGatesImg.onload = resolve);
      
      const gatesCapturedAspect = tempGatesImg.width / tempGatesImg.height;
      
      if (gatesFinalWidth / gatesFinalHeight > gatesCapturedAspect) {
        gatesFinalWidth = gatesFinalHeight * gatesCapturedAspect;
      } else {
        gatesFinalHeight = gatesFinalWidth / gatesCapturedAspect;
      }
      const gatesX = (pageWidth - gatesFinalWidth) / 2;
      const gatesY = pdfTopOffset + 6;
      pdf.addImage(gatesImage, 'PNG', gatesX, gatesY, gatesFinalWidth, gatesFinalHeight);
      
      // Add user details to page
      addUserDetailsToPage(pdf, userDetails);

      // Page 3: 45 Devtas (reset first, then enable only this)
      pdf.addPage();
      console.log('Capturing Page 3: 45 Devtas');
      await resetAllFeatures();
      setShowDevtas(true);
      if (completedPolygonPoints.length >= 3) {
        const center = calculatePolygonCenterLocal(completedPolygonPoints);
        drawSmallPolygon(completedPolygonPoints, center);
        drawMediumPolygon(completedPolygonPoints, center);
        drawRingSlices(completedPolygonPoints, center);
      }
      ensureImageAtBack();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Precompute target aspect based on available page area
      const availableWidth = pageWidth - pdfMargin * 2;
      const availableHeight = pageHeight - pdfTopOffset - pdfMargin;
      const targetAspect = availableWidth / availableHeight;

      const devtaImage = await captureCanvasState("45 Devtas", targetAspect);
      
      pdf.setFontSize(16);
      pdf.text("Page 4: 45 Devtas Layout", pageWidth / 2, 20, { align: 'center' });
      
      // Use captured image dimensions for better height utilization
      let finalWidth = availableWidth;
      let finalHeight = availableHeight * 0.9; // Use most of available height
      
      // Create temporary image to get actual captured dimensions
      const tempImg = new Image();
      tempImg.src = devtaImage;
      await new Promise(resolve => tempImg.onload = resolve);
      
      const capturedAspect = tempImg.width / tempImg.height;
      
      // Scale to fit while maximizing size
      if (finalWidth / finalHeight > capturedAspect) {
        // Height-constrained: use full height, reduce width
        finalWidth = finalHeight * capturedAspect;
      } else {
        // Width-constrained: use full width, reduce height  
        finalHeight = finalWidth / capturedAspect;
      }
      const x = (pageWidth - finalWidth) / 2;
      const y = pdfTopOffset + 6;
      pdf.addImage(devtaImage, 'PNG', x, y, finalWidth, finalHeight);
      
      // Add user details to page
      addUserDetailsToPage(pdf, userDetails);

      // Page 5: 45 Devtas Names Dialog
      pdf.addPage();
      console.log('Capturing Page 5: 45 Devtas Names');
      await resetAllFeatures();
      setShowDevtaNamesDialog(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      let devtaNamesDataUrl: string | null = null;
      let devtaNamesCanvasEl: HTMLCanvasElement | null = null;
      const devtaNamesEl = document.querySelector('[data-dialog-content]') as HTMLElement | null;
      if (devtaNamesEl) {
        console.log('Found devta names dialog element for PDF capture');
        
        // Temporarily remove scroll/height constraints on the dialog itself
        const originalDialogMaxHeight = devtaNamesEl.style.maxHeight;
        const originalDialogOverflow = devtaNamesEl.style.overflow;
        const originalDialogHeight = devtaNamesEl.style.height;
        devtaNamesEl.style.maxHeight = 'none';
        devtaNamesEl.style.overflow = 'visible';
        devtaNamesEl.style.height = 'auto';
        
        // Temporarily remove scroll constraints on the inner scroll container
        const scrollContainer = devtaNamesEl.querySelector('[data-scroll-container]') as HTMLElement | null;
        const originalMaxHeight = scrollContainer?.style.maxHeight;
        const originalOverflow = scrollContainer?.style.overflow;
        const originalHeight = scrollContainer?.style.height;
        if (scrollContainer) {
          scrollContainer.style.maxHeight = 'none';
          scrollContainer.style.overflow = 'visible';
          scrollContainer.style.height = 'auto';
        }
        
        // Choose the capture target (inner content if available)
        const captureEl = (devtaNamesEl.querySelector('[data-devta-names-content]') as HTMLElement) || devtaNamesEl;
        
        // Wait for layout adjustment
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const fullWidth = captureEl.scrollWidth;
        const fullHeight = captureEl.scrollHeight;
        
        // Clone content into an offscreen container to avoid clipping from ancestors
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-10000px';
        tempContainer.style.top = '0';
        tempContainer.style.background = '#ffffff';
        tempContainer.style.padding = '24px';
        tempContainer.style.width = fullWidth + 'px';
        tempContainer.style.height = 'auto';
        const cloned = captureEl.cloneNode(true) as HTMLElement;
        cloned.style.width = '100%';
        tempContainer.appendChild(cloned);
        document.body.appendChild(tempContainer);
        
        // Wait for layout paint
        await new Promise(r => setTimeout(r, 100));
        
        const c = await html2canvas(tempContainer as HTMLElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
          width: tempContainer.scrollWidth,
          height: tempContainer.scrollHeight,
          windowWidth: Math.max(document.documentElement.clientWidth, tempContainer.scrollWidth),
          windowHeight: Math.max(document.documentElement.clientHeight, tempContainer.scrollHeight),
          scrollX: 0,
          scrollY: -window.scrollY,
        });
        
        // Cleanup temp container
        document.body.removeChild(tempContainer);
        
        devtaNamesCanvasEl = c;
        devtaNamesDataUrl = c.toDataURL('image/png');
        console.log('Successfully captured devta names dialog', { fullWidth, fullHeight });
        
        // Restore original scroll constraints
        if (scrollContainer) {
          scrollContainer.style.maxHeight = originalMaxHeight || '';
          scrollContainer.style.overflow = originalOverflow || '';
          scrollContainer.style.height = originalHeight || '';
        }
        devtaNamesEl.style.maxHeight = originalDialogMaxHeight || '';
        devtaNamesEl.style.overflow = originalDialogOverflow || '';
        devtaNamesEl.style.height = originalDialogHeight || '';
      } else {
        console.warn('Devta names dialog element not found for PDF capture');
      }
      setShowDevtaNamesDialog(false);
      await new Promise(resolve => setTimeout(resolve, 200));
      pdf.setFontSize(16);
      pdf.text("Page 5: 45 Devtas Names", pageWidth / 2, 20, { align: 'center' });
      if (devtaNamesDataUrl && devtaNamesCanvasEl) {
        // Maximize dialog area within margins
        const dialogRatio = devtaNamesCanvasEl.height / devtaNamesCanvasEl.width;
        const dialogAvailableWidth = pageWidth - pdfMargin * 2;
        const dialogAvailableHeight = pageHeight - pdfTopOffset - pdfMargin;
        let dialogW = dialogAvailableWidth;
        let dialogH = dialogW * dialogRatio;
        if (dialogH > dialogAvailableHeight) {
          dialogH = dialogAvailableHeight;
          dialogW = dialogH / dialogRatio;
        }
        const dialogX = (pageWidth - dialogW) / 2;
        const dialogY = pdfTopOffset + 6;
        pdf.addImage(devtaNamesDataUrl, 'PNG', dialogX, dialogY, dialogW, dialogH);
      } else {
        pdf.text("(Devta names unavailable)", pageWidth / 2, 35, { align: 'center' });
      }
      
      // Add user details to page
      addUserDetailsToPage(pdf, userDetails);

      // Page 6: 16 Direction Bar Graph (reset first, then show dialog)
      pdf.addPage();
      console.log('Capturing Page 6: 16 Direction Bar Graph');
      await resetAllFeatures();
      setShow16BarChart(true);
      await new Promise(resolve => setTimeout(resolve, 600));
      let barChartDataUrl: string | null = null;
      let chartCanvasEl: HTMLCanvasElement | null = null;
      const chartEl = document.getElementById('direction-chart-capture');
      if (chartEl) {
        const c = await html2canvas(chartEl as HTMLElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
        });
        chartCanvasEl = c;
        barChartDataUrl = c.toDataURL('image/png');
      } else {
        console.warn('Direction chart element not found for PDF capture');
      }
      setShow16BarChart(false);
      await new Promise(resolve => setTimeout(resolve, 200));
      pdf.setFontSize(16);
      pdf.text("Page 6: 16 Direction Bar Graph Analysis", pageWidth / 2, 20, { align: 'center' });
      if (barChartDataUrl && chartCanvasEl) {
        // Maximize chart area within margins
        const chartRatio = chartCanvasEl.height / chartCanvasEl.width;
        const chartAvailableWidth = pageWidth - pdfMargin * 2;
        const chartAvailableHeight = pageHeight - pdfTopOffset - pdfMargin;
        let chartW = chartAvailableWidth;
        let chartH = chartW * chartRatio;
        if (chartH > chartAvailableHeight) {
          chartH = chartAvailableHeight;
          chartW = chartH / chartRatio;
        }
        const chartX = (pageWidth - chartW) / 2;
        const chartY = pdfTopOffset + 6;
        pdf.addImage(barChartDataUrl, 'PNG', chartX, chartY, chartW, chartH);
      } else {
        pdf.text("(Chart unavailable)", pageWidth / 2, 35, { align: 'center' });
      }
      
      // Add user details to page
      addUserDetailsToPage(pdf, userDetails);

      // Page 7: Marma Sthan (reset first, then enable only this)
      pdf.addPage();
      console.log('Capturing Page 7: Marma Sthan');
      await resetAllFeatures();
      setShowMarmaSthan(true);
      if (completedPolygonPoints.length >= 3) {
        const center = calculatePolygonCenterLocal(completedPolygonPoints);
        drawMarmaSthan(completedPolygonPoints, center);
      }
      ensureImageAtBack();
      await new Promise(resolve => setTimeout(resolve, 500));
      const mW = pageWidth - pdfMargin * 2;
      const mH = pageHeight - pdfTopOffset - pdfMargin;
      const mTargetAspect = mW / mH;
      const marmaSthanImage = await captureCanvasState("Marma Sthan", mTargetAspect);
      
      pdf.setFontSize(16);
      pdf.text("Page 7: Marma Sthan (4 Directional Lines)", pageWidth / 2, 20, { align: 'center' });
      const marmaAvailableWidth = pageWidth - pdfMargin * 2;
      const marmaAvailableHeight = pageHeight - pdfTopOffset - pdfMargin;
      // Use captured image dimensions for better height utilization
      let marmaFinalWidth = marmaAvailableWidth;
      let marmaFinalHeight = marmaAvailableHeight * 0.9;
      
      const tempMarmaImg = new Image();
      tempMarmaImg.src = marmaSthanImage;
      await new Promise(resolve => tempMarmaImg.onload = resolve);
      
      const marmaCapturedAspect = tempMarmaImg.width / tempMarmaImg.height;
      
      if (marmaFinalWidth / marmaFinalHeight > marmaCapturedAspect) {
        marmaFinalWidth = marmaFinalHeight * marmaCapturedAspect;
      } else {
        marmaFinalHeight = marmaFinalWidth / marmaCapturedAspect;
      }
      const marmaX = (pageWidth - marmaFinalWidth) / 2;
      const marmaY = pdfTopOffset + 6;
      pdf.addImage(marmaSthanImage, 'PNG', marmaX, marmaY, marmaFinalWidth, marmaFinalHeight);
      
      // Add user details to page
      addUserDetailsToPage(pdf, userDetails);

      // Page 8: Vithi Mandal (reset first, then enable only this)
      pdf.addPage();
      console.log('Capturing Page 8: Vithi Mandal');
      await resetAllFeatures();
      setShowVithiMandal(true);
      if (completedPolygonPoints.length >= 3) {
        const center = calculatePolygonCenterLocal(completedPolygonPoints);
        drawVithiMandalPolygons(completedPolygonPoints, center);
      }
      ensureImageAtBack();
      await new Promise(resolve => setTimeout(resolve, 500));
      const vW = pageWidth - pdfMargin * 2;
      const vH = pageHeight - pdfTopOffset - pdfMargin;
      const vTargetAspect = vW / vH;
      const vithiImage = await captureCanvasState("Vithi Mandal", vTargetAspect);
      
      pdf.setFontSize(16);
      pdf.text("Page 8: Vithi Mandal Zones", pageWidth / 2, 20, { align: 'center' });
      const vithiAvailableWidth = pageWidth - pdfMargin * 2;
      const vithiAvailableHeight = pageHeight - pdfTopOffset - pdfMargin;
      // Use captured image dimensions for better height utilization
      let vithiFinalWidth = vithiAvailableWidth;
      let vithiFinalHeight = vithiAvailableHeight * 0.9;
      
      const tempVithiImg = new Image();
      tempVithiImg.src = vithiImage;
      await new Promise(resolve => tempVithiImg.onload = resolve);
      
      const vithiCapturedAspect = tempVithiImg.width / tempVithiImg.height;
      
      if (vithiFinalWidth / vithiFinalHeight > vithiCapturedAspect) {
        vithiFinalWidth = vithiFinalHeight * vithiCapturedAspect;
      } else {
        vithiFinalHeight = vithiFinalWidth / vithiCapturedAspect;
      }
      const vithiX = (pageWidth - vithiFinalWidth) / 2;
      const vithiY = pdfTopOffset + 6;
      pdf.addImage(vithiImage, 'PNG', vithiX, vithiY, vithiFinalWidth, vithiFinalHeight);
      
      // Add user details to page
      addUserDetailsToPage(pdf, userDetails);

      // Restore original states
      await resetAllFeatures();
      if (currentStates.showDevtas && !showDevtas) toggleDevtasVisibility();
      if (currentStates.show16Directions && !show16Directions) toggle16Directions();
      if (currentStates.show32Gates && !show32Gates) toggle32Gates();
      
      if (currentStates.showVithiMandal && !showVithiMandal) toggleVithiMandal();
      if (currentStates.showMarmaSthan && !showMarmaSthan) toggleMarmaSthan(true);
      if (currentStates.show16BarChart && !show16BarChart) setShow16BarChart(true);

      // Save PDF
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `vastu-analysis-report-${timestamp}.pdf`;
      pdf.save(filename);
      
      toast.success(`PDF report exported as ${filename}`);
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error("Failed to export PDF report");
    }
  };

  return (
    <div className={cn("flex flex-col xl:flex-row gap-2 xl:gap-4 h-full", className)}>
      {/* Main Canvas Area - Takes most of the space */}
      <div className="flex-1 flex flex-col gap-2 xl:gap-3 min-h-0">
        <div className="flex flex-wrap gap-1 sm:gap-2 shrink-0">
          <button
            onClick={startDrawing}
            disabled={!imageUrl || isDrawing}
            className={cn(
              "px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base rounded-md sm:rounded-lg font-medium transition-smooth flex-1 sm:flex-none min-w-[100px] sm:min-w-[120px]",
              "bg-primary text-primary-foreground hover:bg-primary-hover",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "shadow-sm sm:shadow-md hover:shadow-lg touch-manipulation h-8 sm:h-auto"
            )}
          >
            {isDrawing ? "Drawing..." : "Draw Polygon"}
          </button>
          
          {isDrawing && polygonPoints.length >= 3 && (
            <button
              onClick={finishPolygon}
              className={cn(
                "px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base rounded-md sm:rounded-lg font-medium transition-smooth flex-1 sm:flex-none min-w-[110px] sm:min-w-[140px]",
                "bg-green-600 text-white hover:bg-green-700",
                "shadow-sm sm:shadow-md hover:shadow-lg touch-manipulation h-8 sm:h-auto"
              )}
            >
              Finish ({polygonPoints.length})
            </button>
          )}
          
          {isDrawing && (
            <>
              <button
                onClick={undoLastPoint}
                disabled={historyIndex <= 0}
                className={cn(
                  "px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-base rounded-md sm:rounded-lg font-medium transition-smooth flex-1 sm:flex-none min-w-[50px] sm:min-w-[70px]",
                  "bg-orange-600 text-white hover:bg-orange-700",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "shadow-sm sm:shadow-md hover:shadow-lg touch-manipulation h-8 sm:h-auto flex items-center gap-1 justify-center"
                )}
              >
                <Undo2 size={12} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Undo</span>
              </button>
              
              <button
                onClick={redoLastPoint}
                disabled={historyIndex >= polygonHistory.length - 1}
                className={cn(
                  "px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-base rounded-md sm:rounded-lg font-medium transition-smooth flex-1 sm:flex-none min-w-[50px] sm:min-w-[70px]",
                  "bg-orange-600 text-white hover:bg-orange-700",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "shadow-sm sm:shadow-md hover:shadow-lg touch-manipulation h-8 sm:h-auto flex items-center gap-1 justify-center"
                )}
              >
                <Redo2 size={12} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Redo</span>
              </button>
            </>
          )}
          
          <button
            onClick={exportCanvas}
            disabled={!imageUrl || !currentPolygon}
            className={cn(
              "px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base rounded-md sm:rounded-lg font-medium transition-smooth flex-1 sm:flex-none min-w-[70px] sm:min-w-[100px]",
              "bg-green-600 text-white hover:bg-green-700",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "shadow-sm sm:shadow-md hover:shadow-lg touch-manipulation h-8 sm:h-auto flex items-center gap-1 justify-center"
            )}
          >
            <Download size={14} className="sm:w-4 sm:h-4" />
            PNG
          </button>
          
          <button
            onClick={exportPDFReport}
            disabled={!imageUrl || !currentPolygon}
            className={cn(
              "px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base rounded-md sm:rounded-lg font-medium transition-smooth flex-1 sm:flex-none min-w-[70px] sm:min-w-[100px]",
              "bg-blue-600 text-white hover:bg-blue-700",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "shadow-sm sm:shadow-md hover:shadow-lg touch-manipulation h-8 sm:h-auto flex items-center gap-1 justify-center"
            )}
          >
            <FileText size={14} className="sm:w-4 sm:h-4" />
            PDF Report
          </button>
          
          <button
            onClick={clearCanvas}
            disabled={!imageUrl}
            className={cn(
              "px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base rounded-md sm:rounded-lg font-medium transition-smooth flex-1 sm:flex-none min-w-[60px] sm:min-w-[80px]",
              "bg-secondary text-secondary-foreground hover:bg-muted",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "shadow-sm sm:shadow-md hover:shadow-lg touch-manipulation h-8 sm:h-auto"
            )}
          >
            Clear
          </button>
        </div>
        
        <div className="border border-border rounded-lg shadow-lg overflow-hidden bg-card flex-1 flex items-center justify-center min-h-0">
          <canvas 
            ref={canvasRef} 
            className="max-w-full max-h-full touch-manipulation"
            style={{ cursor: isDrawing ? 'crosshair' : 'default' }}
          />
        </div>
        
        {isDrawing && (
          <div className="text-sm text-muted-foreground bg-warning/10 border border-warning/20 rounded-lg p-3 shrink-0">
            <p>💡 Tap to add points to your polygon. {polygonPoints.length >= 3 ? "Use the Finish button to complete your polygon." : "Add at least 3 points to finish."}</p>
          </div>
        )}
      </div>

      {/* Side Panel - Compact and positioned to the side */}
      <div className="w-full xl:w-72 xl:max-w-sm bg-card border border-border rounded-lg shadow-lg p-3 xl:p-4 shrink-0 xl:h-full xl:overflow-y-auto">
        <div className="space-y-3 xl:space-y-4">
          {/* Area Analysis */}
          <div className="space-y-2 xl:space-y-3">
            <div className="flex items-center gap-2 text-sm xl:text-base font-semibold text-foreground">
              <div className="w-3 h-3 xl:w-4 xl:h-4 border-2 border-blue-500 rounded"></div>
              <span>Area Analysis</span>
            </div>
            
            {completedPolygonPoints.length >= 3 && (
              <div className="space-y-2 xl:space-y-3">
                {/* Statistics removed per user request - keeping only feature controls below */}
                
                     {/* Shared Rotation Controls */}
                    {completedPolygonPoints.length >= 3 && (show16Directions || show32Gates || showDevtas || show32Entrances || showMarmaSthan || showTest) && (
                    <div className="pt-2 xl:pt-3 border-t border-border space-y-2 xl:space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs xl:text-sm font-medium">Universal Rotation</span>
                        <div className="px-2 py-1 text-xs rounded-full font-medium bg-blue-100 text-blue-800">
                          {rotationDegree}°
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Slider
                          value={[rotationDegree]}
                          onValueChange={(value) => {
                            const displayValue = Math.max(0, Math.min(360, Number(value[0])));
                            setRotationDegree(displayValue);
                          }}
                          max={360}
                          min={0}
                          step={1}
                          className={cn("w-full touch-manipulation", isRotating && "opacity-75")}
                        />
                        
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={rotationDegree}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                setRotationDegree(0);
                                return;
                              }
                              const numValue = parseInt(value) || 0;
                              setRotationDegree(Math.max(0, Math.min(360, numValue)));
                            }}
                            min={0}
                            max={360}
                            step={1}
                            className="flex-1 h-8 text-xs xl:text-sm touch-manipulation"
                            placeholder="0-360°"
                          />
                          <button
                            onClick={() => setRotationDegree(0)}
                            className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded touch-manipulation"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                      {/* Feature Toggles */}
                  {completedPolygonPoints.length >= 3 && (
                    <div className="pt-2 xl:pt-3 border-t border-border space-y-2 xl:space-y-3">
                      {/* Compact toggle layout */}
                      <div className="space-y-2">
                        {/* 16 Directions Toggle */}
                        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <span className="text-xs xl:text-sm font-medium">16 Directions</span>
                          <Switch
                            checked={show16Directions}
                            onCheckedChange={toggle16Directions}
                            className="data-[state=checked]:bg-purple-600 touch-manipulation scale-90 xl:scale-100"
                          />
                        </div>
                        
                        {/* 32 Gates Toggle */}
                        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <span className="text-xs xl:text-sm font-medium">32 Gates</span>
                          <Switch
                            checked={show32Gates}
                            onCheckedChange={toggle32Gates}
                            className="data-[state=checked]:bg-green-600 touch-manipulation scale-90 xl:scale-100"
                          />
                        </div>
                        
                        
                        {/* 45 Devtas Toggle */}
                        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <span className="text-xs xl:text-sm font-medium">45 Devtas</span>
                          <Switch
                            checked={showDevtas}
                            onCheckedChange={toggleDevtasVisibility}
                            className="data-[state=checked]:bg-blue-600 touch-manipulation scale-90 xl:scale-100"
                          />
                        </div>
                        
                        {/* 45 Devtas Names Toggle */}
                        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <span className="text-xs xl:text-sm font-medium">45 Devtas Names</span>
                          <Switch
                            checked={showDevtaNamesDialog}
                            onCheckedChange={toggleDevtaNamesDialog}
                            className="data-[state=checked]:bg-purple-600 touch-manipulation scale-90 xl:scale-100"
                          />
                        </div>
                        
                         {/* 16 Bar Chart Toggle */}
                        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <span className="text-xs xl:text-sm font-medium">16 Bar Chart</span>
                          <Switch
                            checked={show16BarChart}
                            onCheckedChange={toggle16BarChart}
                            className="data-[state=checked]:bg-orange-600 touch-manipulation scale-90 xl:scale-100"
                          />
                        </div>
                        
                        {/* Marma Sthan Toggle */}
                        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <span className="text-xs xl:text-sm font-medium">Marma Sthan</span>
                          <Switch
                            checked={showMarmaSthan}
                            onCheckedChange={toggleMarmaSthan}
                            className="data-[state=checked]:bg-red-600 touch-manipulation scale-90 xl:scale-100"
                          />
                        </div>
                        
                         {/* 32 Entrances 81 Pad Toggle */}
                        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <span className="text-xs xl:text-sm font-medium">32 Entrances 81 Pad</span>
                          <Switch
                            checked={show32Entrances}
                            onCheckedChange={toggle32Entrances}
                            className="data-[state=checked]:bg-indigo-600 touch-manipulation scale-90 xl:scale-100"
                          />
                        </div>

                         {/* Vithi Mandal Toggle */}
                        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <span className="text-xs xl:text-sm font-medium">Vithi Mandal</span>
                          <Switch
                            checked={showVithiMandal}
                            onCheckedChange={toggleVithiMandal}
                            className="data-[state=checked]:bg-cyan-600 touch-manipulation scale-90 xl:scale-100"
                          />
                        </div>

                         {/* Test Toggle */}
                        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <span className="text-xs xl:text-sm font-medium">Test</span>
                          <Switch
                            checked={showTest}
                            onCheckedChange={toggleTest}
                            className="data-[state=checked]:bg-yellow-600 touch-manipulation scale-90 xl:scale-100"
                          />
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            )}
            
            {completedPolygonPoints.length < 3 && (
              <div className="text-xs xl:text-sm text-muted-foreground text-center py-4 xl:py-6">
                Draw a polygon to see analysis
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Direction Chart Dialog */}
      <DirectionChartDialog
        isOpen={show16BarChart && currentPolygon !== null && completedPolygonPoints.length >= 3}
        onClose={() => setShow16BarChart(false)}
        data={currentPolygon && completedPolygonPoints.length >= 3 ? calculate16DirectionAreas(completedPolygonPoints) : []}
      />

      {/* Devta Names Dialog */}
      <DevtaNamesDialog
        isOpen={showDevtaNamesDialog}
        onClose={() => setShowDevtaNamesDialog(false)}
      />

      {/* PDF User Details Dialog */}
      <Dialog open={showPDFDialog} onOpenChange={setShowPDFDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>PDF Report Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add your details to include them on every page of the PDF report (optional).
            </p>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="pdf-name" className="text-sm font-medium">
                  Name
                </Label>
                <Input
                  id="pdf-name"
                  value={pdfUserDetails.name}
                  onChange={(e) => setPdfUserDetails(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your name"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="pdf-phone" className="text-sm font-medium">
                  Phone
                </Label>
                <Input
                  id="pdf-phone"
                  value={pdfUserDetails.phone}
                  onChange={(e) => setPdfUserDetails(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="pdf-address" className="text-sm font-medium">
                  Address
                </Label>
                <Input
                  id="pdf-address"
                  value={pdfUserDetails.address}
                  onChange={(e) => setPdfUserDetails(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your address"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPDFDialog(false);
                  // Generate PDF without details
                  generatePDFWithDetails({ name: '', phone: '', address: '' });
                }}
              >
                Skip & Generate
              </Button>
              <Button
                onClick={() => {
                  setShowPDFDialog(false);
                  generatePDFWithDetails(pdfUserDetails);
                }}
              >
                Generate PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};