sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    AppUtils,
    Client,
    ServiceNames,
    AbstractPortletHandler
  ) => {
    'use strict';

    /**
     * 성과관리 Portlet
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.P10PortletHandler', {
      sChartId: 'portlet-p10-chart',
      oChartPromise: null,

      getPortletHeightStyleClass(oPortletModel) {
        return this.bMobile ? 'portlet-h2' : `portlet-h${oPortletModel.getProperty('/height') || 0}`;
      },

      async addPortlet() {
        const oPortletModel = this.getPortletModel();
        const oPortletBox = await Fragment.load({
          id: this.getController().getView().getId(),
          name: this.bMobile ? 'sap.ui.yesco.mvc.view.home.mobile.P10PortletBox' : 'sap.ui.yesco.mvc.view.home.fragment.P10PortletBox',
          controller: this,
        });

        oPortletBox.setModel(oPortletModel).bindElement('/').addStyleClass(this.getPortletStyleClasses());

        this.getController().byId(this.sContainerId).addItem(oPortletBox);
        this.setPortletBox(oPortletBox);

        // 다른 화면에 갔다 되돌아오는 경우 id 중복 오류가 발생하므로 체크함
        const oChart = FusionCharts(this.sChartId);
        if (oChart) {
          oChart.dispose();
        }

        this.buildChart();
      },

      buildChart() {
        this.oChartPromise = new Promise((resolve) => {
          FusionCharts.ready(() => {
            FusionCharts.getInstance({
              id: this.sChartId,
              type: 'pie2d',
              renderAt: `${this.sChartId}-container`,
              width: '100%',
              height: '100%',
              dataFormat: 'json',
              dataSource: {
                chart: this.getChartOption(0),
                data: [
                  {
                    label: AppUtils.getBundleText('MSG_00001'), // No data found.
                    value: 100,
                    alpha: 100,
                    color: '#ffffff',
                  },
                ],
              },
              events: {
                rendered: resolve,
              },
            }).render();
          });
        });
      },

      async readContentData() {
        const oModel = this.getController().getModel(ServiceNames.APPRAISAL);
        const mPayload = {
          AppraisalContDetSet: [],
        };

        return Client.deep(oModel, 'AppraisalCont', mPayload);
      },

      transformContentData(aPortletContentData = []) {
        const aColors = ['#f5a369', '#faca74', '#b7c983', '#5ac6b2', '#5aa7c6', '#9a8db7', '#336699', '#67a4ff', '#cce5ff', '#fcccd4'];
        const aSortedData = _.chain(aPortletContentData.AppraisalContDetSet.results)
          .map((o) => _.set(o, 'Fwgt', _.toNumber(o.Fwgt)))
          .orderBy(['Fwgt', 'Z101', 'ElementId'], ['desc', 'asc', 'asc']);
        const aChartData = _.chain(aSortedData)
          .cloneDeep()
          .map((o, i) => ({ label: o.Obj0, color: aColors[i], value: o.Fwgt }))
          .reverse()
          .value();
        const aList = _.chain(aSortedData)
          .map((o, i) => ({
            Color: _.toString(++i),
            Itext: _.truncate(o.Obj0, { length: 35 }),
            Perce: _.toNumber(o.Fwgt),
            Acode: o.Z111,
            Atext: _.isEmpty(o.Z111Tx) ? '미입력' : o.Z111Tx,
          }))
          .value();

        const iPercSum = _.sumBy(aChartData, 'value');
        if (_.sumBy(aChartData, 'value') !== 100) {
          aChartData.splice(0, 0, { label: 'N/A', color: '#f7f7f7', value: 100 - iPercSum });
        }

        setTimeout(() => {
          if (this.oChartPromise) {
            this.oChartPromise.then(() => {
              this.setChartData(aChartData);
            });
          } else {
            this.setChartData(aChartData); // 다른 메뉴를 갔다가 되돌아오는 경우
          }
        }, 300);

        return {
          description: `${aPortletContentData.ZzapstsNm}/${aPortletContentData.ZzapstsSubnm}`,
          list: aList,
          listCount: aList.length,
          aChartData,
        };
      },

      setChartData(aData) {
        const oChart = FusionCharts(this.sChartId);
        oChart.setChartData(
          {
            chart: this.getChartOption(1000),
            data: aData,
          },
          'json'
        );
        oChart.render();
      },

      getChartOption(iAnimateDuration) {
        return FusionCharts.curryChartOptions({
          valueFontSize: 12,
          animateDuration: iAnimateDuration,
          animateClockwise: 1,
          pieRadius: '80%',
          startingAngle: 90,
          showLegend: 0,
          showZeroPies: 1,
          showPercentValues: 1,
          showPercentInTooltip: 1,
          showLabels: 0,
          // enableSmartLabels: 0,
          labelDistance: -5,
          useDataPlotColorForLabels: 0,
          decimals: 1,
          plotToolText: '<div class="fusion-tooltip"><table><tr><th>$label</th><td>$value%</td></tr></table></div>',
        });
      },

      onAfterDragAndDrop() {
        FusionCharts(this.sChartId).render();
      },

      destroy() {
        FusionCharts(this.sChartId).dispose();

        AbstractPortletHandler.prototype.destroy.call(this);
      },
    });
  }
);
