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
     * 근무시간 현황 Portlet
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.P11PortletHandler', {
      sChartId: 'portlet-p11-chart',
      oChartPromise: null,

      async addPortlet() {
        if (this.bMobile) {
          const oPortletModel = this.getPortletModel();
          const oPortletBox = await Fragment.load({
            id: this.getController().getView().getId(),
            name: 'sap.ui.yesco.mvc.view.home.mobile.P11PortletBox',
            controller: this,
          });

          const iPortletHeight = oPortletModel.getProperty('/height');
          oPortletBox.setModel(oPortletModel).bindElement('/').addStyleClass(`portlet-h${iPortletHeight}`);

          this.getController().byId(this.sContainerId).addItem(oPortletBox);
          this.setPortletBox(oPortletBox);
        } else {
          await AbstractPortletHandler.prototype.addPortlet.call(this);

          // 다른 화면에 갔다 되돌아오는 경우 id 중복 오류가 발생하므로 체크함
          const oChart = FusionCharts(this.sChartId);
          if (oChart) {
            oChart.dispose();
          }

          this.buildChart();
        }
      },

      buildChart() {
        this.oChartPromise = new Promise((resolve) => {
          FusionCharts.ready(() => {
            FusionCharts.getInstance({
              id: this.sChartId,
              type: 'angulargauge',
              renderAt: `${this.sChartId}-container`,
              width: '100%',
              height: 154,
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
          Menid: this.getPortletCommonMenid(),
        };

        return Client.getEntitySet(oModel, 'WorkingTime', mPayload);
      },

      transformContentData([mPortletData = {}]) {
        if (!this.bMobile) {
          if (this.oChartPromise) {
            this.oChartPromise.then(() => {
              this.setChartData(mPortletData);
            });
          } else {
            this.setChartData(mPortletData); // 다른 메뉴를 갔다가 되돌아오는 경우
          }
        } else {
          mPortletData.hideTitle = true;
          mPortletData.switchable = false;
        }

        mPortletData.ButtonText1 = this.getMenuName('attendance');
        const Werks = this.getController().getSessionProperty('Werks');
        if ('1000,4000,5000'.split(',').includes(Werks)) {
          mPortletData.ButtonText2 = this.getMenuName('flextime'); // 선택적근로제
        } else if ('3000'.split(',').includes(Werks)) {
          mPortletData.ButtonText2 = this.getMenuName('individualWorkState'); // 개인별근태현황
        } else {
          mPortletData.ButtonText2 = this.getMenuName('workTime'); // 시간외근무신청
        }

        if (mPortletData.Wkrul && mPortletData.Wkrul.indexOf('선택') !== -1) {
          mPortletData.Wktext = 'this month';
        } else {
          mPortletData.Wktext = 'this week';
        }

        return mPortletData;
      },

      getMenuName(sMenuUrl) {
        const oMenuModel = this.getMenuModel();
        const sMenid = oMenuModel.getMenid(this.bMobile ? `mobile/${sMenuUrl}` : sMenuUrl);

        return oMenuModel.getProperties(sMenid).Mname;
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
        return FusionCharts.curryChartOptions({
          gaugeOriginY: 110,
          gaugeOuterRadius: 75,
          gaugeInnerRadius: 53,
          majorTMNumber: 13,
          majorTMColor: '#333333',
          majorTMHeight: -2.5,
          majorTMThickness: 1,
          tickValueDistance: 5,
          tickValueStep: 10,
          showPlotBorder: 0,
          showGaugeBorder: 0,
          showPivotBorder: 0,
          pivotRadius: 3,
          pivotFillColor: '#000000',
          showTooltip: 0,
        });
      },

      getChartColorrangeOption(iWTMax, iOTMax) {
        return {
          color: [
            {
              minValue: 0,
              maxValue: Number(iWTMax),
              code: '#34649d', // 기본 근무시간
            },
            {
              minValue: Number(iWTMax),
              maxValue: Number(iOTMax),
              code: '#fdde17', // 초과 근무시간
            },
          ],
        };
      },

      getChartDialOption(mPortletData) {
        return {
          showValue: 1,
          value: Number(mPortletData.Reltm),
          valueY: 124,
          baseWidth: 4,
          rearExtension: 0,
        };
      },

      onAfterDragAndDrop() {
        FusionCharts(this.sChartId).render();
      },

      onPressButton1() {
        this.navTo('attendance');
      },

      onPressButton2() {
        const Werks = this.getController().getSessionProperty('Werks');
        let sRouteName;
        if ('1000,4000,5000'.split(',').includes(Werks)) {
          sRouteName = 'flextime'; // 선택적근로제
        } else if ('3000'.split(',').includes(Werks)) {
          sRouteName = 'individualWorkState'; // 개인별근태현황
        } else {
          sRouteName = 'workTime'; // 시간외근무신청
        }

        this.navTo(sRouteName);
      },

      destroy() {
        FusionCharts(this.sChartId).dispose();

        AbstractPortletHandler.prototype.destroy.call(this);
      },
    });
  }
);
