var convert = require('../dist/sbgnml-to-cytoscape');
const fs = require("fs");

fs.readFile('./deneme/WP554.gpml', (err, data) => {
  if (err) throw err;
  let cyGraph = convert( data );
//  console.log(cyGraph);
});