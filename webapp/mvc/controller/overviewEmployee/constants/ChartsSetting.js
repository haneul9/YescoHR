sap.ui.define([], function () {
  'use strict';

  return {
    CHART: {
      A02: {
        id: 'employee-a02-chart',
        type: 'hled',
        data: {
          chart: {
            animation: '0',
            chartbottommargin: '5',
            ledGap: '0',
            lowerLimit: '0',
            minorTMNumber: '0',
            upperLimit: '100',
            tickMarkDistance: '5',
            theme: 'ocean',
            showvalue: '0',
            showShadow: '0',
            showGaugeBorder: '0',
            showToolTip: '0',
          },
          colorrange: {
            color: [
              {
                minvalue: '0',
                maxvalue: '22',
                code: '#8FABE8',
              },
              {
                minvalue: '23',
                maxvalue: '25',
                code: '#FC564F',
              },
              {
                minvalue: '26',
                maxvalue: '100',
                code: '#ededed',
              },
            ],
          },
          value: '100',
        },
      },
      A03: {
        id: 'employee-a03-chart',
        type: 'doughnut2d',
        data: {
          chart: {
            showpercentvalues: '1',
            aligncaptionwithcanvas: '0',
            captionpadding: '0',
            decimals: '1',
            theme: 'ocean',
            showLabels: '0',
            labelDistance: '-25',
            startingAngle: '330',
            chartTopMargin: 0,
            chartTopRight: 0,
            chartTopBottom: 0,
            chartTopLeft: 0,
            paletteColors: '#8FABE8,#81DAEA,#77D561,#FFE479,#FC564F',
          },
          data: [
            {
              label: '일반직',
              value: '292',
            },
            {
              label: '임원',
              value: '8',
            },
            {
              label: '계약직',
              value: '4',
            },
            {
              label: '별정직',
              value: '3',
            },
            {
              label: '파견직',
              value: '1',
            },
          ],
        },
      },
      A04: {
        id: 'employee-a04-chart',
        type: 'doughnut2d',
        data: {
          chart: {
            showpercentvalues: '1',
            aligncaptionwithcanvas: '0',
            captionpadding: '0',
            decimals: '1',
            theme: 'ocean',
            showLabels: '0',
            labelDistance: '-25',
            startingAngle: '330',
            chartTopMargin: 0,
            chartTopRight: 0,
            chartTopBottom: 0,
            chartTopLeft: 0,
            paletteColors: '#8FABE8,#81DAEA,#77D561',
          },
          data: [
            {
              label: '팀원',
              value: '274',
            },
            {
              label: '팀장',
              value: '26',
            },
            {
              label: '임원',
              value: '8',
            },
          ],
        },
      },
      A05: {
        id: 'employee-a05-chart',
        type: 'column2d',
        data: {
          chart: {
            showValues: 1,
            rotateValues: 0,
            placeValuesInside: 0,
            yAxisValueFontSize: 9,
            // yAxisMaxValue: 300,
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
          },
          data: [
            {
              label: '0-10',
              value: '173',
              color: '#8FABE8',
            },
            {
              label: '10-20',
              value: '98',
              color: '#8FABE8',
            },
            {
              label: '20-30',
              value: '42',
              color: '#8FABE8',
            },
            {
              label: '30-40',
              value: '12',
              color: '#8FABE8',
            },
          ],
        },
      },
      A06: {
        id: 'employee-a06-chart',
        type: 'hled',
        data: {
          chart: {
            animation: '0',
            chartbottommargin: '5',
            ledGap: '0',
            lowerLimit: '0',
            minorTMNumber: '0',
            upperLimit: '311',
            tickMarkDistance: '5',
            theme: 'ocean',
            showvalue: '0',
            showShadow: '0',
            showGaugeBorder: '0',
            showToolTip: '0',
          },
          colorrange: {
            color: [
              {
                minvalue: '0',
                maxvalue: '287',
                code: '#8FABE8',
              },
              {
                minvalue: '288',
                maxvalue: '311',
                code: '#FC564F',
              },
            ],
          },
          value: '311',
        },
      },
      A07: {
        id: 'employee-a07-chart',
        type: 'doughnut2d',
        data: {
          chart: {
            showpercentvalues: '1',
            aligncaptionwithcanvas: '0',
            captionpadding: '0',
            decimals: '1',
            theme: 'ocean',
            showLabels: '0',
            labelDistance: '-25',
            startingAngle: '330',
            chartTopMargin: 0,
            chartTopRight: 0,
            chartTopBottom: 0,
            chartTopLeft: 0,
            paletteColors: '#8FABE8,#81DAEA,#77D561,#FFE479',
          },
          data: [
            {
              label: '안전',
              value: '117',
            },
            {
              label: '고객서비스',
              value: '64',
            },
            {
              label: '지원',
              value: '53',
            },
            {
              label: '기술',
              value: '38',
            },
          ],
        },
      },
      A08: {
        id: 'employee-a08-chart',
        type: 'doughnut2d',
        data: {
          chart: {
            showpercentvalues: '1',
            aligncaptionwithcanvas: '0',
            captionpadding: '0',
            decimals: '1',
            theme: 'ocean',
            showLabels: '0',
            labelDistance: '-25',
            startingAngle: '330',
            chartTopMargin: 0,
            chartTopRight: 0,
            chartTopBottom: 0,
            chartTopLeft: 0,
            paletteColors: '#8FABE8,#81DAEA,#77D561,#FFE479',
          },
          data: [
            {
              label: '안전',
              value: '117',
            },
            {
              label: '고객서비스',
              value: '64',
            },
            {
              label: '지원',
              value: '53',
            },
            {
              label: '기술',
              value: '38',
            },
          ],
        },
      },
      A09: {
        id: 'employee-a09-chart',
        type: 'column2d',
        data: {
          chart: {
            showValues: 1,
            rotateValues: 0,
            placeValuesInside: 0,
            yAxisValueFontSize: 9,
            // yAxisMaxValue: 300,
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
          },
          data: [
            {
              label: '20-30',
              value: '100',
              color: '#8FABE8',
            },
            {
              label: '30-40',
              value: '178',
              color: '#8FABE8',
            },
            {
              label: '40-50',
              value: '88',
              color: '#8FABE8',
            },
            {
              label: '50-60',
              value: '39',
              color: '#8FABE8',
            },
            {
              label: '60이상',
              value: '25',
              color: '#8FABE8',
            },
          ],
        },
      },
      A10: {
        id: 'employee-a10-chart',
        type: 'bar2d',
        data: {
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
            chartBottomMargin: 0,
            drawCustomLegendIcon: 1,
          },
          data: [
            {
              label: '경영진단팀',
              value: '4',
              color: '#8FABE8',
            },
            {
              label: '기획재경부문',
              value: '23',
              color: '#8FABE8',
            },
            {
              label: '경영지원부문',
              value: '29',
              color: '#8FABE8',
            },
            {
              label: '안전부문',
              value: '170',
              color: '#8FABE8',
            },
            {
              label: '고객서비스부문',
              value: '76',
              color: '#8FABE8',
            },
          ],
        },
      },
      A11: {
        id: 'employee-a11-chart',
        type: 'mscolumn2d',
        data: {
          chart: {
            drawCrossLine: '1',
            rotateValues: '0',
            showValues: '1',
            valueFontSize: 9,
            valueFontColor: '#000000',
            valueBgColor: '#ffffff',
            // yAxisMaxValue: '60',
            placeValuesInside: '0',
            bgColor: 'transparent',
            theme: 'ocean',
            maxColWidth: 23,
          },
          categories: [
            {
              category: [
                { label: '2012' }, //
                { label: '2013' },
                { label: '2014' },
                { label: '2015' },
                { label: '2016' },
                { label: '2017' },
                { label: '2018' },
                { label: '2019' },
                { label: '2020' },
                { label: '2021' },
              ],
            },
          ],
          dataset: [
            {
              seriesname: '팀원',
              color: '#8FABE8',
              data: [
                { value: 38.2 }, //
                { value: 42.5 },
                { value: 39.9 },
                { value: 38.8 },
                { value: 40.7 },
                { value: 49.2 },
                { value: 36.3 },
                { value: 36.5 },
                { value: 41.4 },
                { value: 37.8 },
              ],
            },
            {
              seriesname: '팀장',
              color: '#FFE479',
              data: [
                { value: 10.1 }, //
                { value: 10.8 },
                { value: 10.9 },
                { value: 11.2 },
                { value: 10.3 },
                { value: 11.7 },
                { value: 13.7 },
                { value: 11.6 },
                { value: 10.6 },
                { value: 10.5 },
              ],
            },
          ],
        },
      },
    },
  };
});
