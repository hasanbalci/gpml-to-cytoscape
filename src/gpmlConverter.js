const convert = require('xml-js');
const objPath = require('object-path');

const nodesConverter = require('./nodesConverter');
const edgesConverter = require('./edgesConverter');


module.exports = (gpnmlText) => {

  if (gpnmlText === null) {
    throw new Error(`'${gpnmlText} is invalid input.`);
  }

  const converted = convert.xml2js(gpnmlText, {compact: true, spaces: 2, trim: true, nativeType: true });

  const result = objPath.get(converted, 'Pathway', undefined);
  if (result === undefined) {
    return {nodes: [], edges: []};
  }

  const dataNodes = [];
  const labels = [];
  const shapes = [];
  const groups = [];
  const interactions = [];  
  if (result.DataNode) {
    if (Array.isArray(result.DataNode)) {
      dataNodes.push(...result.DataNode);
    } else {
      dataNodes.push(result.DataNode);
    }
  }
  if (result.Label) {
    if (Array.isArray(result.Label)) {
      labels.push(...result.Label);
    } else {
      labels.push(result.Label);
    }
  }
  if (result.Shape) {
    if (Array.isArray(result.Shape)) {
      shapes.push(...result.Shape);
    } else {
      shapes.push(result.Shape);
    }
  }
  if (result.Group) {
    if (Array.isArray(result.Group)) {
      groups.push(...result.Group);
    } else {
      groups.push(result.Group);
    }
  }
  if (result.Interaction) {
    if (Array.isArray(result.Interaction)) {
      interactions.push(...result.Interaction);
    } else {
      interactions.push(result.Interaction);
    }
  }

  const allNodes = {
    dataNodes: dataNodes,
    labels: labels,
    shapes: shapes,
    groups: groups,
    interactions: interactions
  };
  const {nodes: nodes, nodeIdSet: nodeIdSet, portIdMap} = nodesConverter(allNodes);
  const edges = edgesConverter(interactions, nodeIdSet, portIdMap);
  console.log(edges)
  return {nodes: nodes, edges: edges};
};