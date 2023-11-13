const objPath = require('object-path');

const getId = (interaction) => objPath.get(interaction, '_attributes.GraphId');

//const getClass = (interaction) => objPath.get(interaction, '_attributes.class', '');

const getSource = (interaction, nodeIdSet, portIdMap) => {
  const portSource = getPortSource(interaction);
  return nodeIdSet.has(portSource) ? portSource : portIdMap.get(portSource);
};

const getTarget = (interaction, nodeIdSet, portIdMap) => {
  const portTarget = getPortTarget(interaction);
  return nodeIdSet.has(portTarget) ? portTarget : portIdMap.get(portTarget);
};

const getPortSource = (interaction) => {
  const sourcePoint = objPath.get(interaction, 'Graphics.Point')[0];
  const source = objPath.get(sourcePoint, '_attributes.GraphRef', '');
  return source;
}

const getPortTarget = (interaction) => {
  const targetPoint = objPath.get(interaction, 'Graphics.Point')[1];
  const target = objPath.get(targetPoint, '_attributes.GraphRef', '');
  return target;
}

const getClass = (interaction) => {
  const targetPoint = objPath.get(interaction, 'Graphics.Point')[1];
	let edgeClass = "line"
	if( objPath.get(targetPoint, '_attributes.ArrowHead')){
		edgeClass = objPath.get(targetPoint, '_attributes.ArrowHead');
	}	
  return edgeClass;
}

const getCardinality = (glyph) => parseInt(objPath.get(glyph, 'label._attributes.text', ''));

/* const getBendPointPositions = (arc) => {
  return [].concat(objPath.get(arc, 'next', []))
  .map((bendPoint) => {
    return {
      x: parseInt(bendPoint.x),
      y: parseInt(bendPoint.y)
    };
  });
}; */

const getStyle = (interaction) => {
  let graphics = objPath.get(interaction, 'Graphics._attributes', {ZOrder: '0', LineThickness: '1', LineStyle: '', ConnectorType: '', Color: ''});

  let style = {
    zOrder: parseFloat(graphics.ZOrder),
    lineThickness: parseFloat(graphics.LineThickness),
    lineStyle: graphics.LineStyle,
    connectorType: graphics.ConnectorType,    
    color: graphics.Color
  }

  return style;
};

const convertInteraction = (interaction, nodeIdSet, portIdMap) => {
  if (objPath.get(interaction, 'Graphics.Anchor')) {
		const anchorId = objPath.get(interaction, 'Graphics.Anchor._attributes.GraphId');
		const interactions = [{
			data: {
				id: getId(interaction) + '-1',
				//'class': getClass(interaction),
				//cardinality: interaction.glyph ? getCardinality(interaction.glyph): 0,
				source: getSource(interaction, nodeIdSet, portIdMap),
				target: anchorId,
				class: "Line",
				style: getStyle(interaction)
				//bendPointPositions: getBendPointPositions(interaction)
			}
		},
		{
			data: {
				id: getId(interaction) + '-2',
				//'class': getClass(interaction),
				//cardinality: interaction.glyph ? getCardinality(interaction.glyph): 0,
				source: anchorId,
				target: getTarget(interaction, nodeIdSet, portIdMap),
				class: getClass(interaction),
				style: getStyle(interaction)
				//bendPointPositions: getBendPointPositions(interaction)
			}
		}]
		return interactions;		
  }
  else {
		return {
			data: {
				id: getId(interaction),
				//'class': getClass(interaction),
				//cardinality: interaction.glyph ? getCardinality(interaction.glyph): 0,
				source: getSource(interaction, nodeIdSet, portIdMap),
				target: getTarget(interaction, nodeIdSet, portIdMap),
				class: getClass(interaction),
				style: getStyle(interaction)
				//bendPointPositions: getBendPointPositions(interaction)
			}
		};
  }
};

const convertGraphicalLine = (graphicalLine, nodeIdSet, portIdMap) => {
  const sourcePoint = objPath.get(graphicalLine, 'Graphics.Point')[0];
  const source = objPath.get(sourcePoint, '_attributes.GraphId', '');
  const targetPoint = objPath.get(graphicalLine, 'Graphics.Point')[1];
  const target = objPath.get(targetPoint, '_attributes.GraphId', '');	
	return {
		data: {
			id: getId(graphicalLine),
			//'class': getClass(interaction),
			//cardinality: interaction.glyph ? getCardinality(interaction.glyph): 0,
			source: getSource(graphicalLine, nodeIdSet, portIdMap) || source,
			target: getTarget(graphicalLine, nodeIdSet, portIdMap) || target,
			class: 'graphicalLine',
			style: getStyle(graphicalLine)
			//bendPointPositions: getBendPointPositions(interaction)
		}
	};
}

const validInteraction = (interaction, nodeIdSet, portIdMap) => {
  const srcNodeId = getSource(interaction, nodeIdSet, portIdMap);
  const tgtNodeId = getTarget(interaction, nodeIdSet, portIdMap);
  return (nodeIdSet.has(srcNodeId)) && (nodeIdSet.has(tgtNodeId));
};

const convertEdges = (allEdges, nodeIdSet, portIdMap) => {
	const edges = [];

	// process interactions
	let interactions = allEdges.interactions;
	const validInteractions = interactions.filter((interaction) => validInteraction(interaction, nodeIdSet, portIdMap));
	validInteractions.forEach((interaction) => {
		const edge = convertInteraction(interaction, nodeIdSet, portIdMap);
		if (Array.isArray(edge)) {
			edges.push(...edge);
		}
		else {
			edges.push(edge)
		}
	});

	// process graphical lines
	let graphicalLines = allEdges.graphicalLines;
	graphicalLines.forEach((graphicalLine) => {
		const edge = convertGraphicalLine(graphicalLine, nodeIdSet, portIdMap);
		edges.push(edge);
	});

	return edges;
};
module.exports = convertEdges;
