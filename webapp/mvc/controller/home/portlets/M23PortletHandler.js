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
     * 근무시간 현황 Portlet (임원용)
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.M23PortletHandler', {
      sChartId: 'portlet-m23-chart',
      oChartPromise: null,

      async addPortlet() {
        const oPortletModel = this.getPortletModel();
        const oPortletBox = await Fragment.load({
          id: this.getController().getView().getId(),
          name: 'sap.ui.yesco.mvc.view.home.fragment.M23PortletBox',
          controller: this,
        });

        oPortletBox.setModel(oPortletModel).bindElement('/');

        this.getController().byId(this.sContainerId).addItem(oPortletBox);
        this.setPortletBox(oPortletBox);

        // 다른 화면에 갔다 되돌아오는 경우 id 중복 오류가 발생하므로 체크함
        if (!FusionCharts(this.sChartId)) {
          this.buildChart();
        }
      },

      buildChart() {
        this.oChartPromise = new Promise((resolve) => {
          FusionCharts.ready(() => {
            new FusionCharts({
              id: this.sChartId,
              type: 'angulargauge',
              renderAt: `${this.sChartId}-container`,
              width: '100%',
              height: '100%',
              dataFormat: 'json',
              dataSource: {
                chart: this.getChartOption(),
                colorrange: this.getChartColorrangeOption(40, 52),
                dials: {
                  dial: [this.getChartDialOption({ Reltm: 0 })],
                },
              },
              events: {
                rendered: resolve,
              },
            }).render();
          });
        });
      },

      async readContentData() {
        const oModel = this.getController().getModel(ServiceNames.WORKTIME);
        const mPayload = {
          Menid: this.getMenid('workTime'),
        };

        return Client.getEntitySet(oModel, 'WorkingTime', mPayload);
      },

      transformContentData([mPortletData = {}]) {
        if (this.oChartPromise) {
          this.oChartPromise.then(() => {
            this.setChartData(mPortletData);
          });
        } else {
          this.setChartData(mPortletData); // 다른 메뉴를 갔다가 되돌아오는 경우
        }

        return mPortletData;
      },

      setChartData(mPortletData) {
        const oChart = FusionCharts(this.sChartId);
        oChart.setChartData(
          {
            chart: this.getChartOption(),
            colorrange: this.getChartColorrangeOption(mPortletData.Alwtm, mPortletData.Maxtm),
            dials: {
              dial: [this.getChartDialOption(mPortletData)],
            },
          },
          'json'
        );
        setTimeout(() => {
          oChart.render();
        }, 200);
      },

      getChartOption() {
        return {
          showValue: 1,
          valueFontSize: 12,
          showTooltip: 0,
          gaugeOriginY: 125,
          gaugeOuterRadius: 107,
          gaugeInnerRadius: 75,
          majorTMNumber: 13,
          majorTMColor: '#333',
          majorTMHeight: -2.5,
          majorTMThickness: 1,
          tickValueDistance: 5,
          tickValueStep: 10,
          showPlotBorder: 0,
          showGaugeBorder: 0,
          showPivotBorder: 0,
          bgColor: 'transparent',
          pivotRadius: 3,
          pivotFillColor: '#000',
          theme: 'ocean',
        };
      },

      getChartColorrangeOption(iWTMax, iOTMax) {
        return {
          color: [
            {
              minValue: 0,
              maxValue: iWTMax,
              code: '#34649d', // 기본 근무시간
            },
            {
              minValue: iWTMax,
              maxValue: iOTMax,
              code: '#fdde17', // 초과 근무시간
            },
          ],
        };
      },

      getChartDialOption(mPortletData) {
        return {
          value: mPortletData.Reltm,
          valueY: 142,
          baseWidth: 4,
          rearExtension: 0,
        };
      },

      onAfterDragAndDrop() {
        FusionCharts(this.sChartId).render();
      },
    });
  }
);
