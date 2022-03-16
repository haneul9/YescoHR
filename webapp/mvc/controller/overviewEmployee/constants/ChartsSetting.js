sap.ui.define([], function () {
  'use strict';

  return {
    COLORS: ['#7BB4EB', '#81DAEA', '#A9F482', '#FFE479', '#FFB7AF', '#FFAC4B', '#D484F2', '#A684F2', '#9090FF', '#ACB3FF'],
    CHART_TYPE: [
      {
        Headty: 'A',
        Target: 'A01',
        Chart: 'none',
        Fields: [
          { prop: 'Cnt01', path: [0, 'Cnt01'] }, //
          { prop: 'Cnt02', path: [0, 'Cnt02'] },
          { prop: 'Cnt03', path: [0, 'Cnt03'] },
          { prop: 'Cnt01C', path: [0, 'Cod01'] },
          { prop: 'Cnt02C', path: [0, 'Cod02'] },
          { prop: 'Cnt03C', path: [0, 'Cod03'] },
          { prop: 'Cnt40', path: [1, 'Cnt01'] },
          { prop: 'Cnt41', path: [1, 'Cnt02'] },
          { prop: 'Cnt42', path: [1, 'Cnt03'] },
          { prop: 'Cnt40C', path: [1, 'Cod01'] },
          { prop: 'Cnt41C', path: [1, 'Cod02'] },
          { prop: 'Cnt42C', path: [1, 'Cod03'] },
          { prop: 'Cnt50', path: [2, 'Cnt01'] },
          { prop: 'Cnt51', path: [2, 'Cnt02'] },
          { prop: 'Cnt52', path: [2, 'Cnt03'] },
          { prop: 'Cnt50C', path: [2, 'Cod01'] },
          { prop: 'Cnt51C', path: [2, 'Cod02'] },
          { prop: 'Cnt52C', path: [2, 'Cod03'] },
          { prop: 'Cnt60', path: [3, 'Cnt01'] },
          { prop: 'Cnt61', path: [3, 'Cnt02'] },
          { prop: 'Cnt62', path: [3, 'Cnt03'] },
          { prop: 'Cnt60C', path: [3, 'Cod01'] },
          { prop: 'Cnt61C', path: [3, 'Cod02'] },
          { prop: 'Cnt62C', path: [3, 'Cod03'] },
          { prop: 'Cnt70', path: [4, 'Cnt01'] },
          { prop: 'Cnt71', path: [4, 'Cnt02'] },
          { prop: 'Cnt72', path: [4, 'Cnt03'] },
          { prop: 'Cnt70C', path: [4, 'Cod01'] },
          { prop: 'Cnt71C', path: [4, 'Cod02'] },
          { prop: 'Cnt72C', path: [4, 'Cod03'] },
        ],
      },
      {
        Headty: 'B',
        Target: 'A05',
        Chart: 'column2d',
        Fields: [
          { prop: 'Cnt01', path: [0, 'Rte01'] }, //
        ],
      },
      {
        Headty: 'C',
        Target: 'A09',
        Chart: 'column2d',
        Fields: [
          { prop: 'Cnt01', path: [0, 'Rte01'] }, //
        ],
      },
      {
        Headty: 'D',
        Target: 'A02',
        Chart: 'hled',
        Fields: [
          { prop: 'Title01', path: [0, 'Ttltxt'] }, //
          { prop: 'Title10', path: [1, 'Ttltxt'] },
          { prop: 'Title20', path: [2, 'Ttltxt'] },
          { prop: 'Cnt01', path: [0, 'Cnt01'] },
          { prop: 'Cnt02', path: [0, 'Rte01'] },
          { prop: 'Cod01', path: [0, 'Cod01'] },
          { prop: 'Cnt11', path: [1, 'Rte01'] },
          { prop: 'Cnt12', path: [1, 'Cnt01'] },
          { prop: 'Cod02', path: [1, 'Cod01'] },
          { prop: 'Cnt21', path: [2, 'Rte01'] },
          { prop: 'Cnt22', path: [2, 'Cnt01'] },
          { prop: 'Cod03', path: [2, 'Cod01'] },
        ],
        RangeCount: 3,
        Limit: '100',
        UsedProp: 'Rte01',
      },
      {
        Headty: 'E',
        Target: 'A06',
        Chart: 'hled',
        Fields: [
          { prop: 'Cnt11', path: [0, 'Rte01'] },
          { prop: 'Cnt12', path: [0, 'Cnt01'] },
          { prop: 'Cod01', path: [0, 'Cod01'] },
          { prop: 'Cnt21', path: [1, 'Rte01'] },
          { prop: 'Cnt22', path: [1, 'Cnt01'] },
          { prop: 'Cod02', path: [1, 'Cod01'] },
        ],
        RangeCount: 2,
        Limit: '',
        UsedProp: 'Cnt01',
      },
      { Headty: 'F', Target: 'A10', Chart: 'bar2d' },
      { Headty: 'G', Target: 'A03', Chart: 'doughnut2d' },
      { Headty: 'H', Target: 'A07', Chart: 'doughnut2d' },
      { Headty: 'I', Target: 'A04', Chart: 'doughnut2d' },
      { Headty: 'J', Target: 'A08', Chart: 'doughnut2d' },
      { Headty: 'K', Target: 'A11', Chart: 'mscolumn2d' },
    ],
    CHART_OPTIONS: {
      hled: {
        chart: {
          baseFontSize: 12,
          valueFontSize: 12,
          animation: '0',
          chartbottommargin: '5',
          ledGap: '0',
          lowerLimit: '0',
          minorTMNumber: '0',
          upperLimit: '100',
          tickMarkDistance: '1',
          majorTMColor: '#ededed',
          theme: 'ocean',
          showvalue: '0',
          showShadow: '0',
          showGaugeBorder: '0',
          showToolTip: '0',
        },
        value: '',
        colorrange: { color: [] },
      },
      doughnut2d: {
        chart: {
          baseFontSize: 12,
          valueFontSize: 12,
          showpercentvalues: '1',
          aligncaptionwithcanvas: '0',
          captionpadding: '0',
          decimals: '1',
          theme: 'ocean',
          showLabels: '0',
          labelDistance: '1',
          smartLabelClearance: '0',
          useEllipsesWhenOverflow: '0',
          skipOverlapLabels: '0',
          startingAngle: '330',
          chartTopMargin: 0,
          chartRightMargin: 0,
          chartBottomMargin: 2,
          chartLeftMargin: 0,
          paletteColors: '#7BB4EB,#81DAEA,#77D561,#FFE479,#FC564F',
          toolTipBgColor: '#ffffff',
          toolTipColor: '#222222',
          showToolTipShadow: 1,
          plotcolorintooltip: 1,
          plottooltext: "<div class='fusion-tooltip'><table><tr><th>$label</th><td>$value</td></tr></table></div>",
        },
        data: [],
      },
      column2d: {
        chart: {
          baseFontSize: 12,
          valueFontSize: 12,
          showValues: 1,
          rotateValues: 0,
          placeValuesInside: 0,
          numDivLines: 3,
          divLineDashed: 0,
          divLineColor: '#eeeeee',
          maxColWidth: 23,
          theme: 'ocean',
          bgColor: 'transparent',
          valueFontSize: 9,
          valueFontColor: '#000000',
          valueBgColor: '#ffffff',
          showPlotBorder: 1,
          plotBorderThickness: 3,
          plotBorderColor: '#ffffff',
          chartBottomMargin: 0,
          drawCustomLegendIcon: 1,
          toolTipBgColor: '#ffffff',
          toolTipColor: '#222222',
          showToolTipShadow: 1,
          plotcolorintooltip: 1,
          plottooltext: "<div class='fusion-tooltip'><table><tr><th>$label</th><td>$value</td></tr></table></div>",
        },
        data: [],
      },
      bar2d: {
        chart: {
          baseFontSize: 12,
          valueFontSize: 12,
          showValues: 1,
          rotateValues: 0,
          placeValuesInside: 0,
          numDivLines: 3,
          divLineDashed: 0,
          divLineColor: '#eeeeee',
          maxColWidth: 23,
          theme: 'ocean',
          bgColor: 'transparent',
          valueFontSize: 9,
          valueFontColor: '#000000',
          valueBgColor: '#ffffff',
          showPlotBorder: 1,
          plotBorderThickness: 3,
          plotBorderColor: '#ffffff',
          chartBottomMargin: 2,
          drawCustomLegendIcon: 1,
          toolTipBgColor: '#ffffff',
          toolTipColor: '#222222',
          showToolTipShadow: 1,
          plotcolorintooltip: 1,
          plottooltext: "<div class='fusion-tooltip'><table><tr><th>$label</th><td>$value</td></tr></table></div>",
        },
        data: [],
      },
      mscolumn2d: {
        chart: {
          baseFontSize: 12,
          valueFontSize: 12,
          animation: 0,
          showValues: 1,
          rotateValues: 0,
          placeValuesInside: 0,
          numDivLines: 3,
          divLineDashed: 0,
          divLineColor: '#eeeeee',
          maxColWidth: 23,
          theme: 'ocean',
          bgColor: 'transparent',
          valueFontSize: 9,
          valueFontColor: '#000000',
          valueBgColor: '#ffffff',
          legendIconSides: 0,
          showPlotBorder: 1,
          plotBorderThickness: 3,
          plotBorderColor: '#ffffff',
          chartBottomMargin: 0,
          drawCustomLegendIcon: 1,
          toolTipBgColor: '#ffffff',
          toolTipColor: '#222222',
          showToolTipShadow: 1,
          plotcolorintooltip: 1,
          plottooltext: "<div class='fusion-tooltip'><table><tr><th>$seriesname-$label</th><td>$value</td></tr></table></div>",
        },
        categories: [{ category: [] }],
        dataset: [],
      },
    },
  };
});
