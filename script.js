//space measurements
const margin = {t:50, r:100, b:50, l:100};
const padding = 3;
const w = d3.select('.module').node().clientWidth;
const h = d3.select('.module').node().clientHeight;
const ww = w - margin.l - margin.r;
const hh = h - margin.t - margin.b;
const barW = ww/8;
const barPosI = (2.5*ww)/8;
const barPosO = (4.5*ww)/8;

//variables
let input;
const link = './shelter_counts_2016.csv';
const colorsIntake = ['#7c717e','#928893','#a8a1a9','#bfbac0','#d6d3d6'];
const colorsOutcomeL = ['#5e967f','#7ba794','#97b8aa','#b4cbc0','#d1dcd7'];
const colorsOutcomeO = ['#d78e64','#dea17e','#e4b49a','#e9c7b6'];
//to help create color scales:
//http://gka.github.io/palettes/#colors=lightyellow,orange,deeppink,darkred|steps=7|bez=1|coL=1


//data parse function
function parse(d){
  if(d.category == 'gross intakes'){
    d.cat = 'intake';
  }
  else { d.cat = 'outcome'};

  return{
    date: d.date,
    orgs:	+d.orgs,
    cat: d.cat,
    subcat:	d.category,
    type:	d.type,
    species: d.species,
    count: +d.count
  };
};

//create prompt for user input
const inputPrompt = d3.select('.prompt');

const inputSvg = inputPrompt.append('svg')
  .attr('class','input-svg')
  .attr('height','50px');

const inputText = inputSvg.append('text')
  .attr('class','input-text')
  .attr('text-anchor','middle')
  .attr('x',(w/2)+'px')
  .attr('y','14px')
  .text('Which animal do you like more?');

const inputButtons = inputPrompt.append('g')
  .attr('id','input-buttons');

inputButtons.append('a')
  .attr('class','button')
  .html('cats')
  .style('cursor','pointer')
  .on('click',function(d){
    input = 'cats';
    draw(input);
    inputPrompt.style('display','none');
  });

inputButtons.append('a')
  .attr('class','button')
  .html('dogs')
  .style('cursor','pointer')
  .on('click',function(d){
    input = 'dogs';
    draw(input);
    inputPrompt.style('display','none');
  });

const buttonW = d3.select('#input-buttons').node().getBoundingClientRect().width;

inputButtons
  .style('padding-left',((w/2)-(buttonW/2))+'px')
  .style('padding-right',((w/2)-(buttonW/2))+'px');

//load data
function draw(input){

  d3.csv(link, parse, function(err,counts){

    const year = counts[0].date;
    const orgs = counts[0].orgs;

    //filter for user-input
    // input = 'cats';
    const countsFilter = counts.filter(function(d){ return d.species == input});


    /*------------------------data manipulation------------------------*/

    const countsIntake = countsFilter.filter(function(d){ return d.cat == 'intake'});
    const countsOutcome = countsFilter.filter(function(d){ return d.cat == 'outcome'});

    //group by type
    const countsIntakeType = d3.nest()
      .key(function(d){ return d.type; })
      .rollup(function(leaves){
        return { count: d3.sum(leaves, function(d){ return d.count; }) }
      })
      .entries(countsIntake);
    const countsOutcomeType = d3.nest()
      .key(function(d){ return d.type; })
      .rollup(function(leaves){
        return { count: d3.sum(leaves, function(d){ return d.count; }) }
      })
      .entries(countsOutcome);

    //create object of counts where type is key
    let strayCount, relinquishedCount, transferCount, otherCount, ownerEuthCount;
    let adoptionCount, returnOwnerCount, returnFieldCount,
      diedCount, lostCount, euthCount;

    countsIntakeType.forEach(function(d){
      if(d.key == 'stray/at large'){ strayCount = d.value.count; }
      else if(d.key == 'relinquished by owner'){ relinquishedCount = d.value.count; }
      else if(d.key == 'transfer in from agency'){ transferCount = d.value.count; }
      else if(d.key == 'other intakes'){ otherCount = d.value.count; }
      else if(d.key == 'owner-intended euthanasia'){ ownerEuthCount =  d.value.count; }
    });

    const countsIntakeTotal = [
      {
        stray: strayCount,
        relinquished: relinquishedCount,
        transfer: transferCount,
        other: otherCount,
        ownerEuth: ownerEuthCount
      }
    ];

    countsOutcomeType.forEach(function(d){
      if(d.key == 'adoption'){ adoptionCount = d.value.count; }
      else if(d.key == 'return to owner'){ returnOwnerCount = d.value.count; }
      else if(d.key == 'transfer to another agency'){ transferCount = d.value.count; }
      else if(d.key == 'return to field'){ returnFieldCount = d.value.count; }
      else if(d.key == 'other live outcome'){ otherCount =  d.value.count; }
      else if(d.key == 'died in care'){ diedCount =  d.value.count; }
      else if(d.key == 'lost in care'){ lostCount =  d.value.count; }
      else if(d.key == 'shelter euthanasia'){ euthCount =  d.value.count; }
      else if(d.key == 'owner-intended euthanasia'){ ownerEuthCount =  d.value.count; }
    });

    const countsOutcomeTotalL = [
      {
        adoption: adoptionCount,
        returnOwner: returnOwnerCount,
        transfer: transferCount,
        returnField: returnFieldCount,
        other: otherCount
      }
    ];
    const countsOutcomeTotalO = [
      {
        died: diedCount,
        lost: lostCount,
        euth: euthCount,
        ownerEuth: ownerEuthCount
      }
    ];

    //stack data for bar chart
    const keysIntake = ['stray', 'relinquished', 'transfer', 'other', 'ownerEuth'];
    const keysOutcomeL = ['adoption', 'returnOwner', 'transfer', 'returnField', 'other'];
    const keysOutcomeO = ['died', 'lost', 'euth', 'ownerEuth'];

    const stackIntake = d3.stack()
      .keys(keysIntake)
      .order(d3.stackOrderDescending)
      .offset(d3.stackOffsetNone);
    const stackOutcomeL = d3.stack()
      .keys(keysOutcomeL)
      .order(d3.stackOrderDescending)
      .offset(d3.stackOffsetNone);
    const stackOutcomeO = d3.stack()
      .keys(keysOutcomeO)
      .order(d3.stackOrderDescending)
      .offset(d3.stackOffsetNone);

    const seriesIntake = stackIntake(countsIntakeTotal);
    const seriesOutcomeL = stackOutcomeL(countsOutcomeTotalL);
    const seriesOutcomeO = stackOutcomeO(countsOutcomeTotalO);

    //map type keys to type desc for tooltip
    const iMap = d3.map();
    const oMap = d3.map();

    countsIntakeType.forEach(function(a){
      for(var i in countsIntakeTotal[0]){
        if(countsIntakeTotal[0][i] == a.value.count){
          iMap.set(i,a.key);
        };
      };
    });
    countsOutcomeType.forEach(function(a){
      for(var i in countsOutcomeTotalL[0]){
        if(countsOutcomeTotalL[0][i] == a.value.count){
          oMap.set(i,a.key);
        };
      };
      for(var i in countsOutcomeTotalO[0]){
        if(countsOutcomeTotalO[0][i] == a.value.count){
          oMap.set(String(i),a.key);
        };
      };
    });


    /*------------------------scales------------------------*/

    //y-scale
    const sumIntake = d3.sum(countsIntake, function(d){ return d.count});
    const sumOutcome = d3.sum(countsOutcome, function(d){ return d.count});
    const max = d3.max([sumIntake, sumOutcome]);
    const scaleY = d3.scaleLinear().domain([0, max]).range([hh, 0]);

    //color scale
    seriesIntake.sort(function(a, b){
      return a[0][0] - b[0][0];
    });
    seriesOutcomeL.sort(function(a, b){
      return a[0][0] - b[0][0];
    });
    seriesOutcomeO.sort(function(a, b){
      return a[0][0] - b[0][0];
    });

    const scaleIntake = seriesIntake.map(function(d){ return d.key; });
    const scaleDomainL = seriesOutcomeL.map(function(d){ return d.key; });
    const scaleDomainO = seriesOutcomeO.map(function(d){ return d.key; });

    const scaleColorI = d3.scaleOrdinal()
      .domain(scaleIntake)
      .range(colorsIntake);
    const scaleColorL = d3.scaleOrdinal()
      .domain(scaleDomainL)
      .range(colorsOutcomeL);
    const scaleColorO = d3.scaleOrdinal()
      .range(scaleDomainO)
      .range(colorsOutcomeO);


  /*------------------------ratio------------------------*/

    //determine ratio
    const countsOutcomeLive = countsOutcome.filter(function(d){ return d.subcat == 'gross live outcomes'});
    const countsOutcomeOther = countsOutcome.filter(function(d){ return d.subcat == 'other outcomes'});
    const sumOutcomeLive = d3.sum(countsOutcomeLive, function(d){ return d.count});
    const sumOutcomeOther = d3.sum(countsOutcomeOther, function(d){ return d.count});
    const ratioIntake = Math.round(sumIntake/sumOutcomeOther);
    const ratioOutcomeLive = Math.round(sumOutcomeLive/sumOutcomeOther);

    //append ratio text
    const ratiosvg = d3.select('.ratio')
      .append('svg')
      .attr('class','ratio-svg')
      .attr('width', w)
      .attr('height',100);
    const ratioText = ratiosvg
      .append('text')
      .attr('text-anchor','middle')
      .attr('x',(w/2)+'px')
      .attr('y','14px');

    ratioText
      .append('tspan')
      .attr('class','ratio-text')
      .text(`For every `);
    ratioText
      .append('tspan')
      .attr('class','ratio-text')
      .text(`${ratioIntake} `)
      .style('font-weight','400');
    ratioText
      .append('tspan')
      .attr('class','ratio-text')
      .text(`${input} that enter a shelter in the U.S., `);
  ratioText
    .append('tspan')
    .attr('class','ratio-text')
    .attr('x',(w/2)+'px')
    .attr('dy','1.4em')
    .text(`there are `);
    ratioText
      .append('tspan')
      .attr('class','ratio-text')
      .text(`${ratioOutcomeLive} `)
      .style('font-weight','400');
    ratioText
      .append('tspan')
      .attr('class','ratio-text')
      .text(`shelter ${input} that have a live outcome, and `);
    ratioText
      .append('tspan')
      .attr('class','ratio-text')
      .text(`1 `)
      .style('font-weight','400');
    ratioText
      .append('tspan')
      .attr('class','ratio-text')
      .text(`that does not.`);
    ratioText
      .append('tspan')
      .attr('id','ratio-shelters')
      .attr('x',(w/2)+'px')
      .attr('dy','2.8em')
      .text(`These counts are provided by ${orgs.toLocaleString('en')} animal shelters from 2016.`);


  /*------------------------bar chart------------------------*/

    const svgNode = d3.select('.module')
      .append('svg')
      .attr('width', w)
      .attr('height', h);

    const plot = svgNode
      .append('g')
      .attr('class','chart')
      .attr('transform', `translate(${margin.l},${margin.t})`);

    //draw intake bars
    const groupsIntake = plot.append('g')
      .selectAll('g')
      .data(seriesIntake)
      .enter()
      .append('g')
      .attr('class','groupsIntake')
      .style('fill',function(d){return scaleColorI(d.key); })
      .on('mouseenter', function(d){

        thisG = this;
        let info = d3.select(this).node().getBBox();
        let xPosition = info.x - 10;
        let yPosition = info.y + (info.height/2);
        let count = ((d[0][1])-(d[0][0]));

        plot.selectAll('.groupsIntake')
          .transition()
          .duration(200)
          .style('opacity',function(d){
            if(this == thisG){ return 1; }
            else{ return 0.2; }
          });

        tooltip.style('display',null);
        tooltip.attr('transform', 'translate(' + xPosition + ',' + yPosition + ')');
        tooltipText.style('text-anchor','end');
        tooltipText.select('#tooltip-type').text(iMap.get(d.key));
        tooltipText.select('#tooltip-count').text(count.toLocaleString('en'));

      })
      .on('mouseout',function(d){
        plot.selectAll('.groupsIntake')
          .transition()
          .duration(200)
          .style('opacity',1);
        tooltip.style('display','none');
      });

    const rectIntake = groupsIntake.selectAll('rect')
      .data(function(d){return d;})
      .enter()
      .append('rect')
      .attr('x', barPosI)
      .attr('y', function(d) { return scaleY(d[1]); })
      .attr('height', function(d) { return scaleY(d[0]) - scaleY(d[1]); })
      .attr('width', barW);

    //draw live outcome bars
    const groupsOutcomeL = plot.append('g')
      .selectAll('groupsOutcomeL')
      .data(seriesOutcomeL)
      .enter()
      .append('g')
      .attr('class',' groupsOutcome groupsOutcomeL')
      .style('fill',function(d){ return scaleColorL(d.key); })
      .on('mouseenter', function(d){

        thisG = this;
        let info = d3.select(this).node().getBBox();
        let xPosition = info.x + info.width + 10;
        let yPosition = info.y + (info.height/2);
        let count = ((d[0][1])-(d[0][0]));

        plot.selectAll('.groupsOutcome')
          .transition()
          .duration(200)
          .style('opacity',function(d){
            if(this == thisG){ return 1; }
            else{ return 0.2; }
          });

        tooltip.style('display',null);
        tooltip.attr('transform', 'translate(' + xPosition + ',' + yPosition + ')');
        tooltipText.style('text-anchor','start');
        tooltipText.select('#tooltip-type').text(oMap.get(d.key));
        tooltipText.select('#tooltip-count').text(count.toLocaleString('en'));

        labelOutcomeSub.style('display','none');

      })
      .on('mouseout',function(d){
        plot.selectAll('.groupsOutcome')
          .transition()
          .duration(200)
          .style('opacity',1);
        tooltip.style('display','none');
        labelOutcomeSub.style('display',null);
      });

    const rectOutcomeL = groupsOutcomeL.selectAll('rect')
      .data(function(d){return d;})
      .enter()
      .append('rect')
      .attr('x', barPosO)
      .attr('y', function(d) { return scaleY(d[1]); })
      .attr('height', function(d) { return scaleY(d[0]) - scaleY(d[1]); })
      .attr('width', barW);

    //draw other outcome bars
    const groupsOutcomeO = plot.append('g')
      .selectAll('groupsOutcomeO')
      .data(seriesOutcomeO)
      .enter()
      .append('g')
      .attr('class','groupsOutcome groupsOutcomeO')
      .style('fill',function(d){ return scaleColorO(d.key); })
      .on('mouseenter', function(d){

        thisG = this;
        let info = d3.select(this).node().getBBox();
        let xPosition = info.x + info.width + 10;
        let yPosition = info.y + (info.height/2);
        let count = ((d[0][1])-(d[0][0]));

        plot.selectAll('.groupsOutcome')
          .transition()
          .duration(200)
          .style('opacity',function(d){
            if(this == thisG){ return 1; }
            else{ return 0.2; }
          });

        tooltip.style('display',null);
        tooltip.attr('transform', 'translate(' + xPosition + ',' + yPosition + ')');
        tooltipText.style('text-anchor','start');
        tooltipText.select('#tooltip-type').text(oMap.get(d.key));
        tooltipText.select('#tooltip-count').text(count.toLocaleString('en'));

        labelOutcomeSub.style('display','none');

      })
      .on('mouseout',function(d){
        plot.selectAll('.groupsOutcome')
          .transition()
          .duration(200)
          .style('opacity',1);
        tooltip.style('display','none');
        labelOutcomeSub.style('display',null);
      });

    const rectOutcomeO = groupsOutcomeO.selectAll('rect')
      .data(function(d){return d;})
      .enter()
      .append('rect')
      .attr('x', barPosO)
      .attr('y', function(d) { return scaleY(d[1]+sumOutcomeLive); })
      .attr('height', function(d) { return scaleY(d[0]) - scaleY(d[1]); })
      .attr('width', barW);


    /*------------------------tooltip------------------------*/

    const tooltip = plot.append('g')
      .attr('class', 'tooltip')
      .style('display', 'none');

    const tooltipText = tooltip.append('text')
      .attr('font-size', '12px');

      tooltipText
      .append('tspan')
      .attr('id','tooltip-type')
      .attr('x','0px')
      .attr('dy', '0.2em')
      .attr('font-weight','bold');

      tooltipText
      .append('tspan')
      .attr('id','tooltip-count')
      .attr('x','0px')
      .attr('dy', '1.2em');


    /*------------------------labels------------------------*/

    const labels = plot.append('g')
      .attr('class','label');

    //labels below bars
    labels
      .append('text')
      .attr('class','label-text')
      .attr('id','labelIntake')
      .attr('transform','translate(' + (barPosI+(barW/2)) + ',' + (hh+24)+ ')')
      .text('Intakes')
      .style('text-anchor','middle');
    labels
      .append('text')
      .attr('class','label-text')
      .attr('id','labelOutcome')
      .attr('transform','translate(' + (barPosO+(barW/2)) + ',' + (hh+24)+ ')')
      .text('Outcomes')
      .style('text-anchor','middle');

    //counts above bars
    labels
      .append('text')
      .attr('class','label-text')
      .attr('id','totalIntake')
      .attr('transform','translate(' + (barPosI+(barW/2)) + ',' + (scaleY(sumIntake) - 10) + ')')
      .text(sumIntake.toLocaleString('en'))
      .style('text-anchor','middle');
    labels
      .append('text')
      .attr('class','label-text')
      .attr('id','totalOutcome')
      .attr('transform','translate(' + (barPosO+(barW/2)) + ',' + (scaleY(sumOutcome) - 10) + ')')
      .text(sumOutcome.toLocaleString('en'))
      .style('text-anchor','middle');

    //labels and counts for outcome categories
    const barOutcomeL = scaleY(sumOutcomeLive/2);
    const barOutcomeO = scaleY(sumOutcome-(sumOutcomeOther/2));
    const adjX = 10;
    const adjY = 0;

    const labelOutcomeSub = labels.append('g')
      .attr('class','labelOutcomeGroup')
    const labelOutcomeL = labelOutcomeSub.append('g')
      .attr('class','labelOutcome-L')
      .attr('transform', 'translate(' + (barPosO+barW+adjX) + ',' + (barOutcomeL+adjY) + ')');
    const labelOutcomeO = labelOutcomeSub.append('g')
      .attr('class','labelOutcome-O')
      .attr('transform', 'translate(' + (barPosO+barW+adjX) + ',' + (barOutcomeO+adjY) + ')');

    const textOutcomeL = labelOutcomeL.append('text');
    const textOutcomeO = labelOutcomeO.append('text');

    textOutcomeL.append('tspan')
      .text('Live Outcomes')
      .style('fill',colorsOutcomeL[0])
      .style('font-weight','600')
      .attr('dy', '0.2em')
      .attr('x','0px');
    textOutcomeL.append('tspan')
      .text(sumOutcomeLive.toLocaleString('en'))
      .attr('x','0px')
      .attr('dy', '1.2em');
    textOutcomeO.append('tspan')
      .text('Died or Lost')
      .style('fill',colorsOutcomeO[0])
      .style('font-weight','600')
      .attr('dy', '0.2em')
      .attr('x','0px');
    textOutcomeO.append('tspan')
      .text(sumOutcomeOther.toLocaleString('en'))
      .attr('x','0px')
      .attr('dy', '1.2em');

    const labelOutcomeLines = labelOutcomeSub.append('g')
      .attr('class','labelOutcome-lines');

    // labelOutcomeLines.append('line')
    //   .attr('x1',barPosO+barW+2)
    //   .attr('y1',barOutcomeL+1)
    //   .attr('x2',barPosO+barW+120)
    //   .attr('y2',barOutcomeL+1)
    //   .attr('stroke',colorsOutcomeL[0])
    //   .attr('stroke-width',1);
    //
    // labelOutcomeLines.append('line')
    //   .attr('x1',barPosO+barW+2)
    //   .attr('y1',barOutcomeO+1)
    //   .attr('x2',barPosO+barW+120)
    //   .attr('y2',barOutcomeO+1)
    //   .attr('stroke',colorsOutcomeO[0])
    //   .attr('stroke-width',1);


  /*------------------------footnote------------------------*/

    d3.select('.source')
      .append('text')
      .text('Data from Shelter Animals Count')

  });
};
