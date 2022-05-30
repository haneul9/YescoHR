(() => {
  if (typeof FusionCharts === 'function') {
    const aHtmlClassList = document.querySelector('html').classList;
    if (!aHtmlClassList.contains('fusioncharts-3-12-2')) {
      aHtmlClassList.add('fusioncharts-3-12-2');
    }
  }
})();
