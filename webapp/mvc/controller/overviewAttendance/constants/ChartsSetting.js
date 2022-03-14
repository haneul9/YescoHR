sap.ui.define([], function () {
  'use strict';

  return {
    COLORS: ['#7BB4EB', '#81DAEA', '#A9F482', '#FFE479', '#FFB7AF', '#FFAC4B', '#D484F2', '#A684F2', '#9090FF', '#ACB3FF'],
    CHART_TYPE: [
      {
        Headty: 'A',
        Target: 'A01',
        Chart: 'cylinder',
        ChartWidth: '110px',
        EntityType: 'HeadCountEntRet',
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
      { Headty: 'B', Target: 'A02', Chart: 'doughnut2d', EntityType: 'HeadCountEntRet' },
      { Headty: 'E', Target: 'A03', Chart: 'mscombi2d', EntityType: 'HeadCountEntRet' },
      { Headty: 'C', Target: 'A04', Chart: 'bar2d', EntityType: 'HeadCountEntRet' },
      { Headty: 'D', Target: 'A05', Chart: 'doughnut2d', EntityType: 'HeadCountEntRet' },
      { Headty: 'F', Target: 'A06', Chart: 'mscombi2d', EntityType: 'HeadCountEntRet' },
      { Headty: 'G', Target: 'A07', Chart: 'bar2d', EntityType: 'HeadCountEntRet' },
      { Headty: 'H', Target: 'A08', Chart: 'doughnut2d', EntityType: 'HeadCountEntRet' },
    ],
    CHART_OPTIONS: {
      cylinder: {
        chart: {
          caption: '', // 출근율
          lowerlimit: '0',
          upperlimit: '100',
          lowerlimitdisplay: '0%',
          upperlimitdisplay: '100%',
          numbersuffix: '%',
          cylfillcolor: '#5d62b5',
          plottooltext: '', // 출근율: <b>{fValue}%</b>
          cylfillhoveralpha: '85',
          animation: 1,
          refreshInstantly: 1,
          theme: 'ocean',
          chartTopMargin: 0,
          chartBottomMargin: 0,
          cylFillColor: '#30c4ee',
          cylYScale: 10,
        },
        value: 0,
      },
      doughnut2d: {
        chart: {
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
        },
        data: [],
      },
      bar2d: {
        chart: {
          showValues: 1,
          rotateValues: 0,
          placeValuesInside: 0,
          yAxisValueFontSize: 9,
          // yAxisMaxValue: 200,
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
        },
        data: [],
      },
      mscombi2d: {
        chart: {
          showSum: 1,
          showValues: 1,
          rotateValues: 0,
          placeValuesInside: 0,
          showYAxisValues: 0,
          yAxisLineThickness: 1,
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
        },
        categories: [
          {
            category: [
              {
                label: 'Jan',
              },
              {
                label: 'Feb',
              },
              {
                label: 'Mar',
              },
              {
                label: 'Apr',
              },
              {
                label: 'May',
              },
              {
                label: 'Jun',
              },
              {
                label: 'Jul',
              },
              {
                label: 'Aug',
              },
              {
                label: 'Sep',
              },
              {
                label: 'Oct',
              },
              {
                label: 'Nov',
              },
              {
                label: 'Dec',
              },
            ],
          },
        ],
        dataset: [
          {
            seriesName: 'Actual Revenue',
            showValues: '1',
            data: [
              {
                value: '16000',
              },
              {
                value: '20000',
              },
              {
                value: '18000',
              },
              {
                value: '19000',
              },
              {
                value: '15000',
              },
              {
                value: '21000',
              },
              {
                value: '16000',
              },
              {
                value: '20000',
              },
              {
                value: '17000',
              },
              {
                value: '25000',
              },
              {
                value: '19000',
              },
              {
                value: '23000',
              },
            ],
          },
          {
            seriesName: 'Projected Revenue',
            renderAs: 'line',
            data: [
              {
                value: '15000',
              },
              {
                value: '16000',
              },
              {
                value: '17000',
              },
              {
                value: '18000',
              },
              {
                value: '19000',
              },
              {
                value: '19000',
              },
              {
                value: '19000',
              },
              {
                value: '19000',
              },
              {
                value: '20000',
              },
              {
                value: '21000',
              },
              {
                value: '22000',
              },
              {
                value: '23000',
              },
            ],
          },
        ],
      },
    },
  };
});
