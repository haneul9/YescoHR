sap.ui.define([], function () {
  'use strict';

  return {
    COLORS: ['#7BB4EB', '#81DAEA', '#A9F482', '#FFE479', '#FFB7AF', '#FFAC4B', '#D484F2', '#A684F2', '#9090FF', '#ACB3FF'],
    CHART_TYPE: [
      {
        Device: ['PC', 'Mobile'],
        Headty: 'A',
        Target: 'A01',
        Chart: 'cylinder',
        ChartWidth: '100%',
        DetailEntity: 'TimeOverviewDetail1',
        Fields: [
          { prop: 'Cnt01', path: [0, 'Cnt01'] }, //
          { prop: 'Cnt02', path: [0, 'Cnt02'] },
          { prop: 'Cnt03', path: [0, 'Cnt03'] },
          { prop: 'Cnt04', path: [0, 'Cnt04'] },
          { prop: 'Cnt05', path: [0, 'Cnt05'] },
          { prop: 'Cnt06', path: [0, 'Cnt06'] },
          { prop: 'Cnt07', path: [0, 'Cnt07'] },
          { prop: 'Cnt08', path: [0, 'Cnt08'] },
          { prop: 'Cnt01C', path: [0, 'Cod01'] },
          { prop: 'Cnt02C', path: [0, 'Cod02'] },
          { prop: 'Cnt03C', path: [0, 'Cod03'] },
          { prop: 'Cnt04C', path: [0, 'Cod04'] },
          { prop: 'Cnt05C', path: [0, 'Cod05'] },
          { prop: 'Cnt06C', path: [0, 'Cod06'] },
          { prop: 'Cnt07C', path: [0, 'Cod07'] },
          { prop: 'Cnt08C', path: [0, 'Cod08'] },
          { prop: 'ChartValue', path: [0, 'Rte01'] },
        ],
      },
      {
        Device: ['PC', 'Mobile'],
        Headty: 'B',
        Target: 'A02',
        Chart: 'column2d',
        DetailEntity: 'TimeOverviewDetail3',
        Fields: [
          { prop: 'Rte01', path: [0, 'Rte01'] }, //
          { prop: 'Rte02', path: [0, 'Rte02'] },
        ],
      },
      {
        Device: ['PC', 'Mobile'],
        Headty: 'C',
        Target: 'A03',
        Chart: 'column2d',
        DetailEntity: 'TimeOverviewDetail3',
        Fields: [
          { prop: 'Rte01', path: [0, 'Rte01'] }, //
          { prop: 'Rte02', path: [0, 'Rte02'] },
        ],
      },
      {
        Device: ['PC', 'Mobile'],
        Headty: 'D',
        Target: 'A04',
        Chart: 'none',
        DetailEntity: 'TimeOverviewDetail2',
        Fields: [
          { prop: 'Rte01', path: [0, 'Rte01'] }, //
          { prop: 'Rte02', path: [0, 'Rte02'] },
          { prop: 'Cnt01', path: [0, 'Cnt01'] },
          { prop: 'Cnt02', path: [0, 'Cnt02'] },
          { prop: 'Cnt03', path: [0, 'Cnt03'] },
          { prop: 'Cnt04', path: [0, 'Cnt04'] },
          { prop: 'Cnt01C', path: [0, 'Cod01'] },
          { prop: 'Cnt02C', path: [0, 'Cod02'] },
          { prop: 'Cnt03C', path: [0, 'Cod03'] },
          { prop: 'Cnt04C', path: [0, 'Cod04'] },
        ],
      },
      { Device: ['PC', 'Mobile'], Headty: 'E', Target: 'A05', Chart: 'bar2d', DetailEntity: 'TimeOverviewDetail2' },
      { Device: ['PC', 'Mobile'], Headty: 'F', Target: 'A06', Chart: 'bar2d', DetailEntity: 'TimeOverviewDetail2' },
      {
        Device: ['PC', 'Mobile'],
        Headty: 'H',
        Target: 'A08',
        Chart: 'bar2d',
        DetailEntity: 'TimeOverviewDetail3',
        Fields: [
          { prop: 'Rte02', path: [0, 'Rte02'] }, //
        ],
      },
      {
        Device: ['PC', 'Mobile'],
        Headty: 'I',
        Target: 'A09',
        Chart: 'bar2d',
        DetailEntity: 'TimeOverviewDetail3',
        Fields: [
          { prop: 'Rte02', path: [0, 'Rte02'] }, //
        ],
      },
      { Device: ['PC'], Headty: 'G', Target: 'A07', Chart: 'mscombi2d', DetailEntity: 'TimeOverviewDetail2' },
      { Device: ['Mobile'], Headty: 'G', Target: 'A07', Chart: 'scrollcombi2d', DetailEntity: 'TimeOverviewDetail2' },
      { Device: ['PC'], Headty: 'J', Target: 'A10', Chart: 'mscolumn2d', DetailEntity: 'TimeOverviewDetail3' },
    ],
    CHART_OPTIONS: {
      cylinder: {
        chart: {
          baseFontSize: '10',
          valueFontSize: '14',
          showValue: '0',
          lowerLimit: '0',
          upperLimit: '100',
          lowerLimitDisplay: '0%',
          upperLimitDisplay: '100%',
          numberSuffix: '%',
          // cylHeight: this.iChartHeight - 20,
          cylYScale: '10',
          cylFillHoverAlpha: '85',
          cylFillColor: '#30c4ee',
          chartTopMargin: '10',
          chartBottomMargin: '10',
          chartRightMargin: '15',
          chartLeftMargin: '15',
          autoScale: '1',
          manageResize: '1',
          animation: '1',
          refreshInstantly: '1',
          toolTipBgColor: '#ffffff',
          toolTipColor: '#222222',
          showToolTipShadow: '1',
          plotColorInTooltip: '1',
          // plotToolText: AppUtils.getBundleText('LABEL_01122', '$dataValue'), // 출근율: <b>$dataValue%</b>
          theme: 'ocean',
        },
        value: 10,
      },
      column2d: {
        chart: {
          baseFontSize: '14',
          valueFontSize: '14',
          showValues: '1',
          rotateValues: '0',
          placeValuesInside: '0',
          rotateLabels: '1',
          slantLabels: '1',
          numDivLines: '3',
          divLineDashed: '0',
          divLineColor: '#eeeeee',
          maxColWidth: '18',
          theme: 'ocean',
          bgColor: 'transparent',
          valueFontColor: '#000000',
          valueBgColor: 'transparent',
          showPlotBorder: '1',
          plotBorderThickness: '3',
          plotBorderColor: '#ffffff',
          chartRightMargin: '0',
          chartBottomMargin: '0',
          chartLeftMargin: '1',
          drawCustomLegendIcon: '1',
          toolTipBgColor: '#ffffff',
          toolTipColor: '#222222',
          showToolTipShadow: '1',
          plotcolorintooltip: '1',
          plottooltext: "<div class='fusion-tooltip'><table><tr><th>$label</th><td>$value</td></tr></table></div>",
        },
        data: [],
      },
      bar2d: {
        chart: {
          baseFontSize: '14',
          valueFontSize: '14',
          showValues: '1',
          rotateValues: '0',
          placeValuesInside: '0',
          numDivLines: '3',
          divLineDashed: '0',
          divLineColor: '#eeeeee',
          maxColWidth: '18',
          theme: 'ocean',
          bgColor: 'transparent',
          valueBgColor: 'transparent',
          valueFontColor: '#000000',
          showPlotBorder: '1',
          plotBorderThickness: '3',
          plotBorderColor: '#ffffff',
          chartTopMargin: '0',
          chartRightMargin: '0',
          chartBottomMargin: '0',
          chartLeftMargin: '0',
          toolTipBgColor: '#ffffff',
          toolTipColor: '#222222',
          showToolTipShadow: '1',
          plotcolorintooltip: '1',
          plottooltext: "<div class='fusion-tooltip'><table><tr><th>$label</th><td>$value</td></tr></table></div>",
        },
        data: [],
      },
      mscolumn2d: {
        chart: {
          baseFontSize: '14',
          valueFontSize: '14',
          legendItemFontSize: '14',
          animation: '0',
          showValues: '1',
          rotateValues: '0',
          placeValuesInside: '0',
          yAxisMaxValue: '40',
          numDivLines: '3',
          divLineDashed: '0',
          divLineColor: '#eeeeee',
          maxColWidth: '23',
          theme: 'ocean',
          bgColor: 'transparent',
          valueFontColor: '#000000',
          valueBgColor: 'transparent',
          legendIconSides: '0',
          showPlotBorder: '1',
          plotBorderThickness: '3',
          plotBorderColor: '#ffffff',
          chartBottomMargin: '0',
          drawCustomLegendIcon: '1',
          toolTipBgColor: '#ffffff',
          toolTipColor: '#222222',
          showToolTipShadow: '1',
          plotcolorintooltip: '1',
          plottooltext: "<div class='fusion-tooltip'><table><tr><th>$seriesname-$label</th><td>$value</td></tr></table></div>",
        },
        categories: [{ category: [] }],
        dataset: [],
      },
      mscombi2d: {
        chart: {
          baseFontSize: '14',
          valueFontSize: '14',
          legendItemFontSize: '14',
          showSum: '1',
          showValues: '1',
          rotateValues: '0',
          placeValuesInside: '0',
          divLineDashed: '0',
          divLineColor: '#eeeeee',
          maxColWidth: '25',
          theme: 'ocean',
          bgColor: 'transparent',
          valueFontColor: '#000000',
          valueBgColor: 'transparent',
          showPlotBorder: '0',
          plotBorderThickness: '3',
          plotBorderColor: '#ffffff',
          drawCustomLegendIcon: '1',
          legendIconSides: '0',
          chartTopMargin: '4',
          chartRightMargin: '0',
          chartBottomMargin: '0',
          chartLeftMargin: '0',
          toolTipBgColor: '#ffffff',
          toolTipColor: '#222222',
          showToolTipShadow: '1',
          plotcolorintooltip: '1',
          plottooltext: "<div class='fusion-tooltip'><table><tr><th>$seriesname-$label</th><td>$value</td></tr></table></div>",
        },
        categories: [],
        dataset: [],
      },
      scrollcombi2d: {
        chart: {
          scrollHeight: '5',
          flatScrollBars: '1',
          scrollShowButtons: '0',
          scrollColor: '#fefefe',
          baseFontSize: '14',
          valueFontSize: '14',
          legendItemFontSize: '14',
          rotateLabels: '1',
          slantLabels: '1',
          showValues: '1',
          rotateValues: '0',
          placeValuesInside: '0',
          divLineDashed: '0',
          divLineColor: '#eeeeee',
          maxColWidth: '25',
          theme: 'ocean',
          bgColor: 'transparent',
          valueFontColor: '#000000',
          valueBgColor: 'transparent',
          showPlotBorder: '0',
          plotBorderThickness: '3',
          plotBorderColor: '#ffffff',
          drawCustomLegendIcon: '1',
          legendIconSides: '0',
          chartTopMargin: '4',
          chartRightMargin: '0',
          chartBottomMargin: '0',
          chartLeftMargin: '0',
          toolTipBgColor: '#ffffff',
          toolTipColor: '#222222',
          showToolTipShadow: '1',
          plotcolorintooltip: '1',
          plottooltext: "<div class='fusion-tooltip'><table><tr><th>$seriesname-$label</th><td>$value</td></tr></table></div>",
        },
        categories: [],
        dataset: [],
      },
    },
  };
});
