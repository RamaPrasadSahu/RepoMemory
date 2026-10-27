import { MarkerType } from '@xyflow/react';

/**
 * Transforms raw API graph data into React Flow nodes and edges with intelligent layout.
 * 
 * @param {Object} rawGraph - { nodes: Array, edges: Array }
 * @returns {Object} - { nodes: Array, edges: Array }
 */
export const transformGraphData = (rawGraph) => {
  if (!rawGraph || !Array.isArray(rawGraph.nodes)) {
    return { nodes: [], edges: [] };
  }

  const rawNodes = rawGraph.nodes;
  const rawEdges = Array.isArray(rawGraph.edges) ? rawGraph.edges : [];

  // Categorize nodes for column-based hierarchical layout
  const changedNodes = [];
  const directlyAffectedNodes = [];
  const transitivelyAffectedNodes = [];
  const testNodes = [];
  const otherNodes = [];

  // Map of targets connected from changed nodes
  const directTargetIds = new Set(
    rawEdges
      .filter((e) => {
        const sourceNode = rawNodes.find((n) => n.id === e.source);
        return sourceNode && sourceNode.status === 'changed';
      })
      .map((e) => e.target)
  );

  rawNodes.forEach((node) => {
    const isTest = (node.type || '').toLowerCase() === 'test' || (node.path || '').includes('.test.') || (node.path || '').includes('.spec.');
    if (isTest) {
      testNodes.push(node);
    } else if (node.status === 'changed') {
      changedNodes.push(node);
    } else if (node.status === 'affected') {
      if (directTargetIds.has(node.id)) {
        directlyAffectedNodes.push(node);
      } else {
        transitivelyAffectedNodes.push(node);
      }
    } else {
      otherNodes.push(node);
    }
  });

  const columns = [
    { title: 'Changed in PR', nodes: changedNodes, x: 50 },
    { title: 'Direct Impact', nodes: directlyAffectedNodes, x: 420 },
    { title: 'Transitive / Models', nodes: transitivelyAffectedNodes, x: 790 },
    { title: 'Test Suites', nodes: testNodes, x: 1160 },
  ];

  // If there are other unaffected nodes, put them in a column or distribute
  if (otherNodes.length > 0) {
    columns.push({ title: 'Context Modules', nodes: otherNodes, x: 1530 });
  }

  const flowNodes = [];
  const NODE_HEIGHT = 120;
  const START_Y = 60;

  columns.forEach((col) => {
    col.nodes.forEach((node, index) => {
      flowNodes.push({
        id: String(node.id),
        type: 'dependencyNode',
        position: {
          x: col.x,
          y: START_Y + index * NODE_HEIGHT,
        },
        data: {
          ...node,
          raw: node,
        },
      });
    });
  });

  // Valid node ID set for edge safety
  const validNodeIds = new Set(flowNodes.map((n) => n.id));

  // Map edges
  const flowEdges = rawEdges
    .filter((edge) => validNodeIds.has(String(edge.source)) && validNodeIds.has(String(edge.target)))
    .map((edge, index) => {
      const sourceNode = flowNodes.find((n) => n.id === String(edge.source));
      const targetNode = flowNodes.find((n) => n.id === String(edge.target));

      const isSourceChanged = sourceNode?.data?.status === 'changed';
      const isTargetAffected = targetNode?.data?.status === 'affected';
      const isTestEdge = edge.type === 'tests' || targetNode?.data?.type === 'test';

      let strokeColor = '#475569';
      let animated = false;

      if (isTestEdge) {
        strokeColor = '#06b6d4'; // cyan
        animated = true;
      } else if (isSourceChanged && isTargetAffected) {
        strokeColor = '#f59e0b'; // amber warning
        animated = true;
      } else if (isSourceChanged) {
        strokeColor = '#818cf8'; // brand violet
      } else if (isTargetAffected) {
        strokeColor = '#f59e0b';
      }

      return {
        id: edge.id || `edge-${edge.source}-${edge.target}-${index}`,
        source: String(edge.source),
        target: String(edge.target),
        type: 'smoothstep',
        animated,
        label: edge.type || undefined,
        labelStyle: {
          fill: '#94a3b8',
          fontSize: 10,
          fontFamily: 'monospace',
          fontWeight: 500,
        },
        labelBgStyle: {
          fill: '#0f172a',
          fillOpacity: 0.85,
        },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
        style: {
          stroke: strokeColor,
          strokeWidth: isSourceChanged || isTargetAffected ? 2 : 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: strokeColor,
        },
        data: {
          type: edge.type,
          metadata: edge.metadata,
        },
      };
    });

  return { nodes: flowNodes, edges: flowEdges };
};

/**
 * Filter graph nodes and edges according to search and status filters.
 */
export const filterGraph = (nodes = [], edges = [], { searchQuery = '', statusFilter = 'all', typeFilter = 'all' } = {}) => {
  const query = searchQuery.trim().toLowerCase();

  const filteredNodes = nodes.filter((node) => {
    const data = node.data || {};
    const label = (data.label || '').toLowerCase();
    const path = (data.path || '').toLowerCase();
    const status = (data.status || '').toLowerCase();
    const type = (data.type || '').toLowerCase();

    // Query filter
    const matchesQuery = !query || label.includes(query) || path.includes(query);

    // Status filter
    const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase();

    // Type filter
    const matchesType = typeFilter === 'all' || type === typeFilter.toLowerCase();

    return matchesQuery && matchesStatus && matchesType;
  });

  const visibleIds = new Set(filteredNodes.map((n) => n.id));

  // Only keep edges connecting visible nodes
  const filteredEdges = edges.filter(
    (edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)
  );

  return { nodes: filteredNodes, edges: filteredEdges };
};
