/***********************************
ToDo: implement css
***********************************/

require.undef('ralphgraph');

define('ralphgraph', ['d3'], function (d3) {
  window.sim = undefined;  // for debugging purposes only
  window.debug = undefined; // for debugging purposes only
  var links = undefined;
  var nodes = undefined;

  function drawGraph(container, data, width, height){
        // var width = 600, height = 600;
        links = data.links.map(d => Object.create(d));
        nodes = data.nodes.map(d => Object.create(d));

        // Links with identical arcs get a `linknum` to calculate bezier anchor.
        // implemented in `linkArc()` called in `tick()`
        for (var i = 0; i < links.length; i++) {
            links[i].id = `edge${i}`;
            if (i != 0 &&
              links[i].source == links[i - 1].source &&
              links[i].target == links[i - 1].target)
            {
              links[i].linknum = links[i - 1].linknum + 1;
            } else { links[i].linknum = 1; };
          };

        //console.log(links);
        const simulation = d3.forceSimulation(nodes)
          .force("link", d3.forceLink(links)
            .id(d => d.id)
            .distance(d => whatNodeTypes(d, 'crm:Event')? 30 : 60))
          .force("charge", d3.forceManyBody().strength(-600))
          .force("center", d3.forceCenter(width / 2, height / 2));

        sim = simulation; //for debugging purposes only

        d3.select("svg").remove();
        const svg = d3.select(container).append("svg")
          .attr("viewBox", [0, 0, 600, 600]);

        svg.append("svg:defs").selectAll("marker")
            .data(["end","none"])
          .enter().append("svg:marker")
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15)
            .attr("refY", -1.5)
            .attr("markerWidth", 8)
            .attr("markerHeight", 8 )
            .attr("orient", "auto")
          .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");

        const link = svg.append("g").attr("class", "edges")
            .selectAll("path")
            .data(links)
          .join("path")
            .attr("class", "edge")
            .attr('id', p => p.id)
            .attr("stroke-opacity", 0.2)
            .attr("stroke", "#333")
            .attr("fill", "none");


        const edgelabels = svg.append("g").attr("class", "edgelabels")
              .selectAll(".edgelabel")
              .data(links)
            .enter()
            .append('text')
              .attr('class','edgelabel')
              .attr('id', (d,i) => 'edgelabel' + i)
              .attr("fill","#000")
              .style("cursor", "pointer")
              .style("font", "6px sans serif")
              .on("click", showMetadata);


        edgelabels.append('textPath')
            .attr('xlink:href', (d, i) => '#edge' + i)
            .style("text-anchor", "middle")
            //.style("pointer-events", "none")
            .attr("startOffset", "50%")
            .text(d => d.type.slice(d.type.indexOf(":")+1));


        const node = svg.append("g").attr("class", "nodes")
            .selectAll(".node")
            .data(nodes)
          .join("g").attr("class", "node")
            .attr("id", d => d.id)
          .call(drag(simulation));

        node.append("circle")
          .attr("stroke", "#fff")
          .attr("stroke-width", 1.5)
          .attr("r", 5)
          .attr("fill", "#f90")
          .style("cursor", "pointer")
          .on("mouseover", highlight)
          .on("click", showMetadata);

        node.append("text")
          .attr("dy", 12)
          .attr("dx", 6)
          .text(d => {
            return (d["rdf:type"] == "crm:Event")? d.id : d["rdfs:label"]
          })
          .style("font", "9px sans serif")
          .clone(true).lower()
          .attr("fill", "none")
          .attr("stroke", "white")
          .attr("stroke-width", 3);


        //node.on("click", highlight);

        simulation.on("tick", () => {
          link.attr("foo", d => {debug = d;})
          link.attr("d", linkArc);
          node.attr("transform", d => "translate(" + d.x + ", " + d.y + ")");
        });

        //var sim = simulation;

        d3.select("#exchangeEvent").on("click", eventNodes);

        return svg;
    }

    function linkArc(d,i,lnks) { // NB i and lnks available as parameters here too
      var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y;
      var qx = dy /  6 * d.linknum,
          qy = -dx / 6 * d.linknum;
      var qx1 = (d.source.x + (dx / 2)) + qx,
          qy1 = (d.source.y + (dy / 2)) + qy;
      return `M${d.source.x} ${d.source.y}
              C${d.source.x} ${d.source.y}, ${qx1} ${qy1}, ${d.target.x} ${d.target.y}`;
    };

    function whatNodeTypes(link, ntype){
      var stype = link.source["rdf:type"];
      var ttype = link.target["rdf:type"];
      var ltype = link.type;
      return (stype == ntype || ttype == ntype)? true : false;
    }

    function eventNodes(){
      /* TODO: generalize the filter mechanism to take desired attributes.
       * TODO: add mechanism to restore state
       * Q: can we act on forces from within this function?
       */
      /****** Modify the appearance of selected nodes:
      const evtNodes = d3.selectAll(".node").filter(n => n['rdf:type'] == "crm:Event")
      evtNodes.each(enode => d3.select(`#${enode.id} circle`)
        .attr("stroke-width", 5)
        .attr("fill", "#f60")
        .attr("r", 32)
        .attr("stroke", "#000")
      )
      d3.selectAll('.edge').filter(d => d.target.id == "Mortimer_Ralph_d_1247").remove()

      *************************/
      var excha = ralphdata.links.filter(x => x.target == "Mortimer_Ralph_d_1247")
      d3.selectAll(".edge")
        .data(excha, (d,i) => console.log(d,i))
        .remove() //this removes link index 0-2 no matter their link id.
    }

    function showMetadata(d,i,nds){
      var clicked = ("target" in d) ? '<div class="clicked-element">Edge Data</div>' : '<div class="clicked-element">Node Data</div>';
      var entries = Object.entries(d.__proto__);
      var table = makeTable(entries);
      var html = clicked + table
      var div = d3.select("#metadata").html(html);
    }

    function highlight(d,i,nds){
      //console.log(d,i,nds)
      //return links to base state
      d3.selectAll('.active').classed("active", false);
      d3.selectAll('.edge').attr("marker-end", "none");

      // get array of links with clicked node as either source or target
      var nodelinks = links.filter(x => x.source.index == i || x.target.index == i);

      // set node class active
      new Set(nodelinks.map(x => [x.source, x.target]).flat())
      .forEach(x => d3.select(`#${x.id}`).classed('active', true))

      // set link class active
      nodelinks.forEach(x =>
        {d3.select("path#edge" + x.index)
        .classed("active", true)
        .attr("marker-end", "url(#end)");

        d3.select("text#edgelabel" + x.index)
        .classed("active", true);}
      );
    }

    var drag = simulation => {

      function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      }
      function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
      return d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended);
    }

  return drawGraph;

  function makeTable(array){
    var html = '<table class="metadata">'
      for (var i=0; i < array.length; i++){
        var d = array[i];
        html += `<tr><td class="key">${d[0]}</td><td class="value">${d[1]}</td></tr>`;
      };
      html += "</table>";
      return html;
    }


});

element.append('<small>&#x25C9; &#x25CB; &#x25EF; Loaded somedamnthing &#x25CC; &#x25CE; &#x25CF;</small>');
