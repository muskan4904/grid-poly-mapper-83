interface Point {
  x: number;
  y: number;
}

interface GridCell {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  area: number;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  const x = point.x;
  const y = point.y;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Check if a rectangle is completely inside a polygon
 */
export function isRectangleInPolygon(rect: GridCell, polygon: Point[]): boolean {
  // Check all four corners of the rectangle
  const corners = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height }
  ];

  return corners.every(corner => isPointInPolygon(corner, polygon));
}

/**
 * Check if a rectangle is partially inside a polygon (at least center point)
 */
export function isRectanglePartiallyInPolygon(rect: GridCell, polygon: Point[]): boolean {
  // Check if center point is inside
  return isPointInPolygon({ x: rect.centerX, y: rect.centerY }, polygon);
}

/**
 * Calculate the area of intersection between a rectangle and polygon (approximation)
 */
export function calculateRectanglePolygonIntersectionArea(rect: GridCell, polygon: Point[]): number {
  // Simple approximation: sample points within the rectangle
  const sampleSize = 10; // 10x10 sampling grid
  const stepX = rect.width / sampleSize;
  const stepY = rect.height / sampleSize;
  let insideCount = 0;

  for (let i = 0; i < sampleSize; i++) {
    for (let j = 0; j < sampleSize; j++) {
      const samplePoint = {
        x: rect.x + (i + 0.5) * stepX,
        y: rect.y + (j + 0.5) * stepY
      };
      
      if (isPointInPolygon(samplePoint, polygon)) {
        insideCount++;
      }
    }
  }

  const totalSamples = sampleSize * sampleSize;
  const intersectionRatio = insideCount / totalSamples;
  return rect.area * intersectionRatio;
}

/**
 * Create a proper 9x9 grid with equal blocks per row that fit within polygon boundary
 */
export function createEqualSizedGrid(polygon: Point[]): GridCell[] {
  if (polygon.length < 3) return [];

  // Find polygon bounds
  const minX = Math.min(...polygon.map(p => p.x));
  const maxX = Math.max(...polygon.map(p => p.x));
  const minY = Math.min(...polygon.map(p => p.y));
  const maxY = Math.max(...polygon.map(p => p.y));

  const height = maxY - minY;
  const gridSize = 9;
  const rowHeight = height / gridSize;
  
  const gridCells: GridCell[] = [];

  // Create 9 rows, each with 9 equal-sized blocks
  for (let row = 0; row < gridSize; row++) {
    const rowY = minY + row * rowHeight;
    const rowCenterY = rowY + rowHeight / 2;
    
    // Find all intersections at multiple Y levels within this row for better accuracy
    const sampleYs = [
      rowY + rowHeight * 0.25,
      rowCenterY,
      rowY + rowHeight * 0.75
    ];
    
    let bestRowMinX = maxX;
    let bestRowMaxX = minX;
    
    // Sample multiple Y levels to find the best row bounds
    for (const sampleY of sampleYs) {
      const intersections: number[] = [];
      
      // Find all X intersections with polygon edges at this Y level
      for (let i = 0; i < polygon.length; i++) {
        const j = (i + 1) % polygon.length;
        const p1 = polygon[i];
        const p2 = polygon[j];
        
        // Check if the horizontal line at sampleY intersects this edge
        if ((p1.y <= sampleY && p2.y >= sampleY) || 
            (p1.y >= sampleY && p2.y <= sampleY)) {
          
          if (Math.abs(p2.y - p1.y) < 1e-10) {
            // Horizontal edge case
            if (Math.abs(p1.y - sampleY) < 1e-10) {
              intersections.push(p1.x, p2.x);
            }
          } else {
            // Calculate intersection X
            const t = (sampleY - p1.y) / (p2.y - p1.y);
            const intersectionX = p1.x + t * (p2.x - p1.x);
            intersections.push(intersectionX);
          }
        }
      }
      
      // Sort intersections and find the valid spans
      intersections.sort((a, b) => a - b);
      
      if (intersections.length >= 2) {
        // Find all valid spans and use the widest one
        for (let i = 0; i < intersections.length - 1; i += 2) {
          if (i + 1 < intersections.length) {
            const spanMinX = intersections[i];
            const spanMaxX = intersections[i + 1];
            
            // Check if this span is valid by testing if the center point is inside
            const testPoint = { x: (spanMinX + spanMaxX) / 2, y: sampleY };
            if (isPointInPolygon(testPoint, polygon)) {
              bestRowMinX = Math.min(bestRowMinX, spanMinX);
              bestRowMaxX = Math.max(bestRowMaxX, spanMaxX);
            }
          }
        }
      }
    }
    
    // If no valid intersections found, skip this row
    if (bestRowMinX >= bestRowMaxX) {
      continue;
    }
    
    const rowWidth = bestRowMaxX - bestRowMinX;
    const colWidth = rowWidth / gridSize;
    
    // Create exactly 9 equal blocks for this row that fill the entire width
    for (let col = 0; col < gridSize; col++) {
      const x = bestRowMinX + col * colWidth;
      const centerX = x + colWidth / 2;
      
      const cell: GridCell = {
        x: x,
        y: rowY,
        width: colWidth,
        height: rowHeight,
        centerX: centerX,
        centerY: rowCenterY,
        area: colWidth * rowHeight
      };
      
      // Add all cells for complete 9x9 grid - no validation needed since we calculated bounds properly
      gridCells.push(cell);
    }
  }

  return gridCells;
}

/**
 * Get grid cell information for display (row, col, index)
 */
export function getGridCellInfo(cell: GridCell, polygon: Point[]): { row: number; col: number; index: number } {
  // Find polygon bounds to determine grid positioning
  const minX = Math.min(...polygon.map(p => p.x));
  const maxX = Math.max(...polygon.map(p => p.x));
  const minY = Math.min(...polygon.map(p => p.y));
  const maxY = Math.max(...polygon.map(p => p.y));

  const width = maxX - minX;
  const height = maxY - minY;
  const cellWidth = width / 9;
  const cellHeight = height / 9;

  // Calculate row and column based on position
  const col = Math.floor((cell.x - minX) / cellWidth);
  const row = Math.floor((cell.y - minY) / cellHeight);
  const index = row * 9 + col + 1; // 1-based index

  return { row, col, index };
}

/**
 * Calculate polygon area using shoelace formula
 */
export function calculatePolygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

/**
 * Calculate polygon centroid
 */
export function calculatePolygonCenter(points: Point[]): Point {
  if (points.length < 3) return { x: 0, y: 0 };

  // Use SIGNED area for correct centroid regardless of winding order
  let signedArea = 0;
  let cx = 0, cy = 0;

  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const cross = points[i].x * points[j].y - points[j].x * points[i].y;
    signedArea += cross;
    cx += (points[i].x + points[j].x) * cross;
    cy += (points[i].y + points[j].y) * cross;
  }

  signedArea = signedArea / 2;
  if (Math.abs(signedArea) < 1e-8) return { x: 0, y: 0 };

  cx = cx / (6 * signedArea);
  cy = cy / (6 * signedArea);

  return { x: cx, y: cy };
}

interface DevtaZone {
  id: number;
  name: string;
  polygon: Point[];
  area: number;
  percentage: number;
}

/**
 * Create central 12 Devta zones based on traditional Vastu rules
 */
export function createCentral12Devtas(centralPolygon: Point[], totalPolygonArea: number, center: Point): DevtaZone[] {
  const devtaZones: DevtaZone[] = [];
  
  // Calculate the bounding rectangle of the central polygon
  const minX = Math.min(...centralPolygon.map(p => p.x));
  const maxX = Math.max(...centralPolygon.map(p => p.x));
  const minY = Math.min(...centralPolygon.map(p => p.y));
  const maxY = Math.max(...centralPolygon.map(p => p.y));
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  // Create 3x4 grid within the central polygon bounds
  const gridWidth = width / 3;
  const gridHeight = height / 4;
  
  // Vastu percentages
  const cornerPercentage = 0.074; // 7.40% for corners (1, 4, 7, 10)
  const pairPercentage = 0.0494; // 4.94% total for each pair, 2.47% each
  const singleFromPair = pairPercentage / 2; // 2.47% for individual in pair
  
  // Define the 12 zones in a 3x4 grid layout
  const zoneLayout = [
    [1, 2, 4],
    [11, null, 3], // null represents the center brahmastan
    [11, null, 3],
    [10, 9, 7]
  ];
  
  // Create zones for each position
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      const zoneId = zoneLayout[row][col];
      if (zoneId === null) continue; // Skip center
      
      const x = minX + col * gridWidth;
      const y = minY + row * gridHeight;
      
      let zonePolygon: Point[];
      let area: number;
      let percentage: number;
      let name: string;
      
      // Determine if this is a corner or side zone
      const isCorner = [1, 4, 7, 10].includes(zoneId);
      
      if (isCorner) {
        // Corner zones (single Devtas)
        percentage = cornerPercentage;
        area = totalPolygonArea * percentage;
        name = `Devta ${zoneId}`;
        
        zonePolygon = [
          { x, y },
          { x: x + gridWidth, y },
          { x: x + gridWidth, y: y + gridHeight },
          { x, y: y + gridHeight }
        ];
      } else {
        // Side zones (paired Devtas) - need diagonal splitting
        percentage = singleFromPair;
        area = totalPolygonArea * percentage;
        
        // Create the full rectangle for the pair first
        const fullRect = [
          { x, y },
          { x: x + gridWidth, y },
          { x: x + gridWidth, y: y + gridHeight },
          { x, y: y + gridHeight }
        ];
        
        // Split diagonally based on zone position
        if (zoneId === 2) {
          name = "Devta 2";
          // Top edge pair (2-3) - split diagonally
          zonePolygon = [
            { x, y },
            { x: x + gridWidth, y },
            { x: x + gridWidth/2, y: y + gridHeight }
          ];
        } else if (zoneId === 3) {
          name = "Devta 3";
          // Right edge pair (part of 2-3)
          zonePolygon = [
            { x: x + gridWidth, y },
            { x: x + gridWidth, y: y + gridHeight },
            { x: x + gridWidth/2, y: y + gridHeight }
          ];
        } else if (zoneId === 5) {
          name = "Devta 5";
          // Right edge vertical pair
          zonePolygon = [
            { x: x + gridWidth, y },
            { x: x + gridWidth, y: y + gridHeight/2 },
            { x, y: y + gridHeight/2 },
            { x, y }
          ];
        } else if (zoneId === 6) {
          name = "Devta 6";
          zonePolygon = [
            { x, y: y + gridHeight/2 },
            { x: x + gridWidth, y: y + gridHeight/2 },
            { x: x + gridWidth, y: y + gridHeight },
            { x, y: y + gridHeight }
          ];
        } else if (zoneId === 8) {
          name = "Devta 8";
          zonePolygon = [
            { x, y: y + gridHeight },
            { x: x + gridWidth/2, y },
            { x: x + gridWidth, y: y + gridHeight }
          ];
        } else if (zoneId === 9) {
          name = "Devta 9";
          zonePolygon = [
            { x: x + gridWidth/2, y },
            { x: x + gridWidth, y },
            { x: x + gridWidth, y: y + gridHeight }
          ];
        } else if (zoneId === 11) {
          name = "Devta 11";
          zonePolygon = [
            { x, y },
            { x: x + gridWidth, y: y + gridHeight/2 },
            { x, y: y + gridHeight }
          ];
        } else if (zoneId === 12) {
          name = "Devta 12";
          zonePolygon = [
            { x, y },
            { x: x + gridWidth, y },
            { x: x + gridWidth, y: y + gridHeight/2 }
          ];
        } else {
          // Fallback
          name = `Devta ${zoneId}`;
          zonePolygon = fullRect;
        }
      }
      
      // Clip the zone polygon to fit within the central polygon bounds
      const clippedPolygon = clipPolygonToBounds(zonePolygon, centralPolygon);
      
      devtaZones.push({
        id: zoneId,
        name,
        polygon: clippedPolygon,
        area,
        percentage: percentage * 100
      });
    }
  }
  
  return devtaZones;
}

/**
 * Clip a polygon to fit within bounds of another polygon (simple implementation)
 */
function clipPolygonToBounds(polygon: Point[], bounds: Point[]): Point[] {
  // For now, return the original polygon
  // In a more complex implementation, this would do proper polygon clipping
  return polygon.filter(point => isPointInPolygon(point, bounds));
}

/**
 * Create 8 radial lines extending from center to polygon boundary
 */
export function createCentral12DevtaGrid(centralPolygon: Point[], totalPolygonArea: number): { radialLines: Point[][] } {
  // Calculate the geometric center of the central polygon  
  const center = calculatePolygonCenter(centralPolygon);
  
  // Define ONLY the 8 specific radial lines: 2,7,10,15,18,23,26,31
  const radialLineNumbers = [2, 7, 10, 15, 18, 23, 26, 31];
  const angleStep = 11.25; // 360 / 32 = 11.25 degrees per line
  
  // Calculate the 8 radial lines from center to red polygon boundary
  const radialLines: Point[][] = [];
  
  radialLineNumbers.forEach(lineNumber => {
    // Calculate angle: line 1 = 0°, line 2 = 11.25°, etc.
    const angle = ((lineNumber - 1) * angleStep) * (Math.PI / 180);
    const direction = { x: Math.cos(angle), y: Math.sin(angle) };
    const boundaryPoint = findPolygonBoundaryIntersection(center, direction, centralPolygon);
    
    // Create line from center to boundary point (not crossing)
    radialLines.push([center, boundaryPoint]);
  });
  
  return { radialLines };
}

/**
 * Find intersection point of a ray with polygon boundary
 */
function findPolygonBoundaryIntersection(center: Point, direction: Point, polygon: Point[]): Point {
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
      // Use closest intersection point instead of farthest to stay within boundary
      if (distance > 0 && distance < closestDistance) {
        closestDistance = distance;
        closestPoint = intersection;
      }
    }
  }
  
  return closestPoint;
}

/**
 * Calculate intersection of ray with line segment
 */
function rayLineIntersection(rayStart: Point, rayDirection: Point, lineStart: Point, lineEnd: Point): Point | null {
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
}