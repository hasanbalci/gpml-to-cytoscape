const objPath = require('object-path');

const validSbgnClass = require('./sbgnTags');

const getCenteredBbox = (node) => {
  let graphics = objPath.get(node, 'Graphics._attributes', {CenterX: 0, CenterY: 0, Width: 0, Height: 0});

  let bbox = {
    x: parseFloat(graphics.CenterX),
    y: parseFloat(graphics.CenterY),
    w: parseFloat(graphics.Width),
    h: parseFloat(graphics.Height)
  }

  return bbox;
};

const getId = (node) => objPath.get(node, '_attributes.GraphId', null);

const getNodeId = (node) => {
  let id = getId(node);
  if (id == null) {
    id = '';
  }

  return id;
};

const getClass = (node) => objPath.get(node, '_attributes.Type', '');

const getLabel = (node) => objPath.get(node, '_attributes.TextLabel', '');

const getParent = (node) => objPath.get(node, '_attributes.GroupRef', '');

const getGroupId = (node) => objPath.get(node, '_attributes.GroupId', '');

/* const getClonemarker = (glyph) => glyph.clone !== undefined; */

const getState = (glyph) => {
  return {
    variable: objPath.get(glyph, 'state._attributes.variable', ''),
    value: objPath.get(glyph, 'state._attributes.value', '')
  };
};

const getStateVar = (glyph) => {
  return {
    id: getId(glyph),
    'class': getClass(glyph),
    state: getState(glyph)
  };
};

const getUnitOfInformation = (glyph) => {
  return {
    id: getId(glyph),
    'class': getClass(glyph),
    label: {
      text: objPath.get(glyph, 'label._attributes.text', '')
    }
  };
};

const getStateVars = (glyph) => {
  return getChildrenArray(glyph)
    .filter((child) =>  getClass(child) === 'state variable')
    .map((stateVar) => getStateVar(stateVar));
};

const getUnitsOfInformation = (glyph) => {
  return getChildrenArray(glyph)
    .filter((child) =>  getClass(child) === 'unit of information')
    .map((g) => getUnitOfInformation(g));
};

const getChildren = (glyph) => {
  return getChildrenArray(glyph).filter((child) => {
    return getClass(child) !== 'unit of information' && getClass(child) !== 'state variable';
  });
};

const getChildrenArray = (glyph) => {
  return [].concat(objPath.get(glyph, 'glyph', []));
};

const getXRef = (dataNode) => {
  let xRef = objPath.get(dataNode, 'Xref._attributes', {Database:'', ID:''});

  return xRef;
};

const getStyle = (node) => {
  let graphics = objPath.get(node, 'Graphics._attributes', {ZOrder: '0', FontSize: '10', VAlign: '', Color: '',  FillColor:'', FontWeight:'', ShapeType:'', LineThickness:'', Rotation:''});

  let style = {
    zOrder: parseFloat(graphics.ZOrder),
    fontSize: parseFloat(graphics.FontSize),
    vAlign: graphics.VAlign,
    color: graphics.Color,
    fillColor: graphics.FillColor,
    fontWeight: graphics.FontWeight,
    shapeType: graphics.ShapeType,
    lineThickness: graphics.LineThickness,
    rotation: graphics.Rotation
  }

  return style;
};

const convertDataNode = (dataNode) => {
  return {
    data: {
      id: getNodeId(dataNode),
      class: getClass(dataNode),
      label: getLabel(dataNode),
      parentId: getParent(dataNode),
      //clonemarker: getClonemarker(glyph),
      //stateVariables: getStateVars(glyph),
      //unitsOfInformation: getUnitsOfInformation(glyph),
      bbox: getCenteredBbox(dataNode),
      xRef: getXRef(dataNode),
      style: getStyle(dataNode)
    }
  };
};

const convertLabel = (label, parent='') => {
  return {
    data: {
      id: getNodeId(label),
      class: 'Label',
      label: getLabel(label),
      parent: label.parent || getParent(label) || parent,
      bbox: getCenteredBbox(label),
      style: getStyle(label)
    }
  };
};

const convertShape = (shape) => {
  return {
    data: {
      id: getNodeId(shape),
      class: 'Shape',
      bbox: getCenteredBbox(shape),
      style: getStyle(shape)
    }
  };
};

const convertGroup = (group) => {
  return {
    data: {
      id: getNodeId(group),
      groupId: getGroupId(group),
      class: 'Group',
      style: objPath.get(group, '_attributes.Style', '')
    }
  };
};

// return node for the anchor
const convertAnchor = (interaction, anchor) => {
  const anchorPos = parseFloat(objPath.get(anchor, '_attributes.Position'));
  const sourcePoint = objPath.get(interaction, 'Graphics.Point')[0];
  const sourcePointX = parseFloat(objPath.get(sourcePoint, '_attributes.X'));
  const sourcePointY = parseFloat(objPath.get(sourcePoint, '_attributes.Y'));
  const targetPoint = objPath.get(interaction, 'Graphics.Point')[1];
  const targetPointX = parseFloat(objPath.get(targetPoint, '_attributes.X'));
  const targetPointY = parseFloat(objPath.get(targetPoint, '_attributes.Y'));
  const anchorX =  sourcePointX + (targetPointX - sourcePointX) * anchorPos;
  const anchorY =  sourcePointY + (targetPointY - sourcePointY) * anchorPos;
  const bbox = {x: anchorX, y: anchorY, w: 1, h: 1}
  return {
    data: {
      id: getNodeId(anchor),
      bbox: bbox,
      class: 'Anchor',
      style: getStyle(anchor)
    }
  };
};

// return node(s) for the source and target of the graphical line, if they don't exist 
const convertGraphicalLine = (graphicalLine, nodeIdSet) => {
  const sourcePoint = objPath.get(graphicalLine, 'Graphics.Point')[0];
  const targetPoint = objPath.get(graphicalLine, 'Graphics.Point')[1];
  const sourcePointPos = {x: parseFloat(objPath.get(sourcePoint, '_attributes.X')), y: parseFloat(objPath.get(sourcePoint, '_attributes.Y'))};
  const targetPointPos = {x: parseFloat(objPath.get(targetPoint, '_attributes.X')), y: parseFloat(objPath.get(targetPoint, '_attributes.Y'))};
  const sourceId = objPath.get(sourcePoint, '_attributes.GraphId');
  const targetId = objPath.get(targetPoint, '_attributes.GraphId');

  let nodes = [];
  if (sourceId && !nodeIdSet.has(sourceId)) {
    let sourceData = {
      data: {
        id: sourceId,
        bbox: {x: sourcePointPos.x, y: sourcePointPos.y, w: 1, h: 1},
        class: 'DummyNode',
        style: {}
      }
    }
    nodeIdSet.add(sourceId);
    nodes.push(sourceData);
  }
  if (targetId && !nodeIdSet.has(targetId)) {
    let targetData = {
      data: {
        id: targetId,
        bbox: {x: targetPointPos.x, y: targetPointPos.y, w: 1, h: 1},
        class: 'DummyNode',
        style: {}
      }
    }
    nodeIdSet.add(targetId);
    nodes.push(targetData);
  }

  return nodes;
}

const getPorts = (glyph) => {
  return [].concat(objPath.get(glyph, 'port', [])).map((port) => {
    return {
      id: getId(port),
      bbox: getCenteredBbox(port)
    };
  });
};

module.exports = (allNodes) => {
  const nodeIdSet = new Set();
  const portIdMap = new Map();
  const stack = [];
  const nodes = [];

  // process dataNodes
  stack.push(...allNodes.dataNodes);
  while (stack.length > 0) {
    const currDataNode = stack.pop();
    const currDataNodeId = getNodeId(currDataNode);
    const processedDataNode = convertDataNode(currDataNode);

//    if (validSbgnClass(processedGlyph.data['class'])) {
      nodes.push(processedDataNode);
      nodeIdSet.add(currDataNodeId);

/*       for (const port of getPorts(currGlyph)) {
        portIdMap.set(port.id, currGlyphId);
      } */

/*       const children = getChildren(currGlyph);
      for (let child of children) {
        child.parent = currGlyphId;
      }

      stack.push(...children); */
    //}
  }

  // process labels
  stack.push(...allNodes.labels);
  while (stack.length > 0) {
    const currLabel = stack.pop();
    const currLabelId = getNodeId(currLabel);
    const processedLabel = convertLabel(currLabel);

    nodes.push(processedLabel);
    nodeIdSet.add(currLabelId);
  }

  // process shapes
  stack.push(...allNodes.shapes);
  while (stack.length > 0) {
    const currShape = stack.pop();
    const currShapeId = getNodeId(currShape);
    const processedShape = convertShape(currShape);

    nodes.push(processedShape);
    nodeIdSet.add(currShapeId);
  }

  // process groups
  stack.push(...allNodes.groups);
  while (stack.length > 0) {
    const currGroup = stack.pop();
    const currGroupId = getNodeId(currGroup);
    const processedGroup = convertGroup(currGroup);

    nodes.push(processedGroup);
    nodeIdSet.add(currGroupId);
  }

  // process interactions to extract anchor nodes
  stack.push(...allNodes.interactions);
  while (stack.length > 0) {
    const currInteraction = stack.pop();
    if (objPath.get(currInteraction, 'Graphics.Anchor')) {
      const currAnchor = objPath.get(currInteraction, 'Graphics.Anchor')
      const currAnchorId = getNodeId(currAnchor);
      const processedAnchor = convertAnchor(currInteraction, currAnchor);
  
      nodes.push(processedAnchor);
      nodeIdSet.add(currAnchorId);
    }
  }

  // process graphical lines to extract source and target nodes
  stack.push(...allNodes.graphicalLines);
  while (stack.length > 0) {
    const currGraphicalLine = stack.pop();
    const processedGraphicalLine = convertGraphicalLine(currGraphicalLine, nodeIdSet);

    if (processedGraphicalLine.length > 0) {
      nodes.push(...processedGraphicalLine);
    }
  }

  return {
    nodes: nodes,
    nodeIdSet: nodeIdSet,
    portIdMap: portIdMap
  };
};
