sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
    'sap/ui/yesco/mvc/model/type/Year', // XML expression binding용 type preloading
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

      async addPortlet() {
        const oPortletModel = this.getPortletModel();
        const oPortletBox = await Fragment.load({
          id: this.getController().getView().getId(),
          name: 'sap.ui.yesco.mvc.view.home.fragment.P10PortletBox',
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
                    value: 0,
                    color: 'transparent',
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
        const oModel = this.getController().getModel(ServiceNames.WORKTIME);
        const mPayload = {
          Menid: AppUtils.getAppComponent().getMenuModel().getMenid('workTime'),
        };

        return Client.getEntitySet(oModel, 'WorkingTime', mPayload);
      },

      transformContentData(aPortletContentData = []) {
        const aChartData = [];
        const aList = [];

        aPortletContentData.forEach((mData) => {
          // if (mData.Gubun === '1') {
          //   aList.push(mData);
          // }
        });

        aChartData.push(
          {
            label: '정합성 있는 노경관계를 구축한다.',
            value: 20,
            color: '#f5a369',
          },
          {
            label: '임단협의 적정성을 확보하고, 구성원들의 만족도를 제고한다.',
            value: 20,
            color: '#faca74',
          },
          {
            label: '인력 효율성을 제고한다.',
            value: 20,
            color: '#b7c983',
          },
          {
            label: '조직역량을 강화한다.',
            value: 10,
            color: '#5ac6b2',
          },
          {
            label: '최적의 IT Business Solution을 제공한다.',
            value: 10,
            color: '#5aa7c6',
            labelDistance: '5',
          },
          {
            label: '정보시스템 지원 강화',
            value: 10,
            color: '#9a8db7',
          },
          {
            label: '우리의 믿음이 내재화 될 수 있도록 독려하고 솔선수범한다.',
            value: 10,
            color: '#9a8db7',
          }
        );
        aChartData.reverse();

        this.oChartPromise.then(() => {
          this.setChartData(aChartData);
        });

        aList.push(
          {
            Color: '1',
            Itext: '정합성 있는 노경관계를 구축한다.',
            Perce: 20,
            Acode: '1',
            Atext: '완료',
          },
          {
            Color: '2',
            Itext: '임단협의 적정성을 확보하고, 구성원들의 만족도를 제고한다.',
            Perce: 20,
            Acode: '1',
            Atext: '완료',
          },
          {
            Color: '3',
            Itext: '인력 효율성을 제고한다.',
            Perce: 20,
            Acode: '2',
            Atext: '진행중',
          },
          {
            Color: '4',
            Itext: '조직역량을 강화한다.',
            Perce: 10,
            Acode: '2',
            Atext: '진행중',
          },
          {
            Color: '5',
            Itext: '최적의 IT Business Solution을 제공한다.',
            Perce: 10,
            Acode: '3',
            Atext: '미실시',
          },
          {
            Color: '6',
            Itext: '정보시스템 지원 강화',
            Perce: 10,
            Acode: '4',
            Atext: '중단',
          },
          {
            Color: '6',
            Itext: '우리의 믿음이 내재화 될 수 있도록 독려하고 솔선수범한다.',
            Perce: 10,
            Acode: '4',
            Atext: '중단',
          }
        );

        return {
          description: '목표수립 1차 평가 합의중',
          list: aList,
          listCount: aList.length,
        };
      },

      setChartData(aData) {
        const oChart = FusionCharts(this.sChartId);
        oChart.setChartData(
          {
            chart: this.getChartOption(),
            data: aData,
          },
          'json'
        );
        oChart.render();
      },

      getChartOption(iAnimateDuration = 1000) {
        return {
          animateDuration: iAnimateDuration,
          animateClockwise: 1,
          startingAngle: 90,
          showLegend: 0,
          showZeroPies: 1,
          showPercentValues: 1,
          showPercentInTooltip: 1,
          showLabels: 0,
          enableSmartLabels: 0,
          labelDistance: -25,
          useDataPlotColorForLabels: 0,
          toolTipSepChar: ' ', // 빈 문자를 넣으면 콤마가 들어가므로 공백 문자로 줌
          decimals: 1,
          chartTopMargin: 0,
          chartTopRight: 0,
          chartTopBottom: 0,
          chartTopLeft: 0,
          theme: 'ocean',
        };
      },

      onAfterDragAndDrop() {
        FusionCharts(this.sChartId).render();
      },
    });
  }
);
