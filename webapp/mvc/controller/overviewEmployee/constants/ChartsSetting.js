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
                code: '#427cac',
              },
              {
                minvalue: '23',
                maxvalue: '25',
                code: '#fe5f58',
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
            theme: 'ocean',
            color: '427cac',
          },
          data: [
            {
              label: '0-10',
              value: '173',
            },
            {
              label: '10-20',
              value: '98',
            },
            {
              label: '20-30',
              value: '42',
            },
            {
              label: '30-40',
              value: '12',
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
                code: '#427cac',
              },
              {
                minvalue: '288',
                maxvalue: '311',
                code: '#fe5f58',
              },
            ],
          },
          value: '311',
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
    },
  };
});
