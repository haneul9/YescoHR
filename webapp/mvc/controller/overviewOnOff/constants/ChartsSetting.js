sap.ui.define([], function () {
  'use strict';

  return {
    COLORS: ['#7BB4EB', '#81DAEA', '#A9F482', '#FFE479', '#FFB7AF', '#FFAC4B', '#D484F2', '#A684F2', '#9090FF', '#ACB3FF'],
    CHART_TYPE: [
      {
        Headty: 'A',
        Target: 'A01',
        Chart: 'none',
        EntityType: 'HeadCountOverview',
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
      { Headty: 'A', Target: 'A02', Chart: 'stackedcolumn2d-S', EntityType: 'HeadCountEntRet' },
      { Headty: 'B', Target: 'A04', Chart: 'stackedcolumn2d-S', EntityType: 'HeadCountEntRet' },
      { Headty: 'C', Target: 'A05', Chart: 'stackedcolumn2d-S', EntityType: 'HeadCountEntRet' },
      { Headty: 'D', Target: 'A03', Chart: 'stackedcolumn2d', EntityType: 'HeadCountEntRet', minDisplayValue: 4 },
      { Headty: 'E', Target: 'A06', Chart: 'msstackedcolumn2dlinedy', EntityType: 'HeadCountEntRet', minDisplayValue: 15 },
    ],
    CHART_OPTIONS: {
      'stackedcolumn2d-S': {
        chart: {
          showValues: 1,
          showLegend: 0,
          rotateValues: 0,
          placeValuesInside: 0,
          showYAxisValues: 0,
          yAxisLineThickness: 0,
          yAxisLineColor: '#ffffff',
          numDivLines: 0,
          divLineDashed: 0,
          divLineColor: '#ffffff',
          maxColWidth: 63,
          theme: 'ocean',
          bgColor: 'transparent',
          valueFontSize: 9,
          valueFontColor: '#000000',
          valueBgColor: 'transparent',
          showPlotBorder: 0,
          plotBorderThickness: 3,
          plotBorderColor: '#ffffff',
          drawCustomLegendIcon: 1,
          chartTopMargin: 0,
          chartRightMargin: 0,
          chartBottomMargin: 0,
          chartLeftMargin: 0,
          toolTipBgColor: '#ffffff',
          toolTipColor: '#222222',
          showToolTipShadow: 1,
          plotcolorintooltip: 1,
          plottooltext: "<div class='fusion-tooltip'><table><tr><th>$seriesname-$label</th><td>$value</td></tr></table></div>",
        },
        categories: [{ category: [] }],
        dataset: [],
      },
      stackedcolumn2d: {
        chart: {
          showSum: 1,
          showValues: 1,
          rotateValues: 0,
          placeValuesInside: 0,
          showYAxisValues: 0,
          yAxisLineThickness: 0,
          yAxisLineColor: '#ffffff',
          numDivLines: 0,
          divLineDashed: 0,
          divLineColor: '#ffffff',
          maxColWidth: 25,
          theme: 'ocean',
          bgColor: 'transparent',
          valueFontSize: 9,
          valueFontColor: '#000000',
          valueBgColor: 'transparent',
          showPlotBorder: 0,
          plotBorderThickness: 3,
          plotBorderColor: '#ffffff',
          drawCustomLegendIcon: 1,
          legendIconSides: 0,
          chartTopMargin: 0,
          chartRightMargin: 0,
          chartBottomMargin: 0,
          chartLeftMargin: 0,
          toolTipBgColor: '#ffffff',
          toolTipColor: '#222222',
          showToolTipShadow: 1,
          plotcolorintooltip: 1,
          plottooltext: "<div class='fusion-tooltip'><table><tr><th>$seriesname-$label</th><td>$value</td></tr></table></div>",
        },
        categories: [{ category: [] }],
        dataset: [],
      },
      msstackedcolumn2dlinedy: {
        chart: {
          showSum: 1,
          showValues: 1,
          rotateValues: 0,
          placeValuesInside: 0,
          showYAxisValues: 0,
          pYAxisMaxValue: 180,
          sYAxisMaxValue: 500,
          yAxisLineThickness: 0,
          yAxisLineColor: '#ffffff',
          numDivLines: 0,
          divLineDashed: 0,
          divLineColor: '#ffffff',
          maxColWidth: 25,
          theme: 'ocean',
          bgColor: 'transparent',
          valueFontSize: 9,
          valueFontColor: '#000000',
          valueBgColor: 'transparent',
          showPlotBorder: 0,
          plotBorderThickness: 3,
          plotBorderColor: '#ffffff',
          drawCustomLegendIcon: 1,
          legendIconSides: 0,
          chartTopMargin: 0,
          chartRightMargin: 0,
          chartBottomMargin: 0,
          chartLeftMargin: 0,
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
