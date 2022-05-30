(() => {
  if (typeof FusionCharts === 'function') {
    const aHtmlClassList = document.querySelector('html').classList;
    if (!aHtmlClassList.contains('fusioncharts-3-18-0')) {
      aHtmlClassList.add('fusioncharts-3-18-0');
    }

    FusionCharts.options.license({
      key: '0oI2cB-21A-16E2D6E2B3G3A2B2A4A3D3E6D4C4sbdC8D5mmaB-8jE1G2awe1C2A3E2E3D3F3A8A4A4A3G3A2A1A33A18B14wjjB4A2H4jB2A16A7D-16buE3A3H2sudB2D3D2wikF1C10B8D5E5E3F4E2H4I3B8lffF4E2UH3vraE4D2C2pcC1DB4A2yyjD1B1G4D2B5B3E3C4E2A1D4D1F2C7p==',
      creditLabel: false,
    });

    FusionCharts.options.defaultChartMessageOptions = {
      baseChartMessageFont: 'Pretendard',
      baseChartMessageFontSize: 14,
    };

    FusionCharts.options.defaultChartOptions = {
      animation: 1,

      baseFont: 'Pretendard',
      baseFontSize: 14,
      valueFontSize: 14,
      valueFontAlpha: 100,
      valueFontColor: '#000000',
      valueBgAlpha: 0, // 투명
      valueBgColor: '#ffffff',
      valueAlpha: 100,

      showValues: 1,
      rotateValues: 0,
      placeValuesInside: 0,

      theme: 'ocean',

      bgAlpha: 0,
      bgColor: '#ffffff',

      chartTopMargin: 0,
      chartRightMargin: 0,
      chartBottomMargin: 0,
      chartLeftMargin: 0,
      canvasTopMargin: 0,
      canvasRightMargin: 0,
      canvasBottomMargin: 0,
      canvasLeftMargin: 0,
      canvasPadding: 0,
      legendPadding: 0,
      plotPaddingPercent: 15,

      legendItemFontSize: 14,
      legendItemFontColor: '#000000',

      tooltipBgAlpha: 100,
      tooltipBgColor: '#ffffff',
      tooltipColor: '#222222',
      showTooltipShadow: 1,
      plotColorInTooltip: 1,
    };

    FusionCharts.getInstance = (mInstanceOptions) => {
      return new FusionCharts($.extend({}, FusionCharts.options.defaultChartMessageOptions, mInstanceOptions));
    };
    FusionCharts.curryChartOptions = (mChartOptions) => {
      return $.extend({}, FusionCharts.options.defaultChartOptions, mChartOptions);
    };
  }
})();
