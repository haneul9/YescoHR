sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
    'sap/ui/yesco/mvc/model/type/Currency', // XML expression binding용 type preloading
    'sap/ui/yesco/mvc/model/type/DateWeekday', // XML expression binding용 type preloading
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
     * 근무 현황 Portlet
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.P06PortletHandler', {
      sChartId: 'portlet-p06-chart',
      oChartPromise: null,

      async addPortlet() {
        const oController = this.getController();
        const oPortletBox = await Fragment.load({
          id: oController.getView().getId(),
          name: 'sap.ui.yesco.mvc.view.home.fragment.P06PortletBox',
          controller: this,
        });

        const oPortletModel = this.getPortletModel();
        oPortletModel.setProperty('/selectedDate', new Date());

        oPortletBox.setModel(oPortletModel).bindElement('/');

        oController.byId(this.sContainerId).addItem(oPortletBox);
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
              type: 'cylinder',
              renderAt: `${this.sChartId}-container`,
              width: '110px',
              height: '100%',
              dataFormat: 'json',
              dataSource: {
                chart: this.getChartOption(0),
                value: 0,
              },
              events: {
                rendered: resolve,
              },
            }).render();
          });
        });
      },

      async readContentData() {
        const oPortletModel = this.getPortletModel();
        const oSelectedDate = oPortletModel.getProperty('/selectedDate') || new Date();

        const oModel = this.getController().getModel(ServiceNames.COMMON);
        const mPayload = {
          Datum: oSelectedDate,
          PortletPcountNav1: [],
          PortletPcountNav2: [],
        };

        return Client.deep(oModel, 'PortletPernrCount', mPayload);
      },

      transformContentData({ PortletPcountNav1, PortletPcountNav2 }) {
        const { Datum, Week, ...mCountData } = ((PortletPcountNav1 || {}).results || [])[0] || {};

        delete mCountData.__metadata;
        delete mCountData.PortletPcountNav1;
        delete mCountData.PortletPcountNav2;

        const mTables = {};
        ((PortletPcountNav2 || {}).results || []).forEach(({ Gubun, Pernr, Ename, Orgtx, Period }) => {
          const mData = { Pernr, Ename, Orgtx, Period };
          if (mTables[Gubun]) {
            mTables[Gubun].push(mData);
          } else {
            mTables[Gubun] = [mData];
          }
        });

        const oPortletModel = this.getPortletModel();
        const mPortletContentData = {
          counts: { Datum, Week, ...mCountData }, // Cnt01, Cnt02, Cnt03, Cnt04, Cnt05, Cnt06, Cnt07
        };

        Object.keys(mCountData).forEach((sKey) => {
          const sTableKey = sKey.replace(/^[\D]+/, '').replace(/^0+/, '');
          const aTableData = mTables[sTableKey] || [];
          mPortletContentData[`table${sTableKey}`] = {
            visiblePeriod: sTableKey !== '1',
            list: aTableData,
            listCount: Math.min(aTableData.length, 5),
          };

          oPortletModel.setProperty(`/table${sTableKey}/list`, []);
        });

        this.oChartPromise.then(() => {
          const fValue = Number(mCountData.Cnt07);
          this.setChartData(fValue);
        });

        return mPortletContentData;
      },

      setChartData(fValue) {
        const oChart = FusionCharts(this.sChartId);
        oChart.setChartData(
          {
            chart: this.getChartOption(fValue),
            value: fValue,
          },
          'json'
        );
        oChart.render();
      },

      getChartOption(fValue) {
        return {
          caption: AppUtils.getBundleText('LABEL_01130'), // 출근율
          lowerlimit: '0',
          upperlimit: '100',
          lowerlimitdisplay: '0%',
          upperlimitdisplay: '100%',
          numbersuffix: '%',
          cylfillcolor: '#5d62b5',
          plottooltext: AppUtils.getBundleText('LABEL_01131', fValue), // 출근율: <b>{fValue}%</b>
          cylfillhoveralpha: '85',
          animation: 1,
          refreshInstantly: 1,
          theme: 'ocean',
          cylFillColor: '#30c4ee',
          cylYScale: 10,
        };
      },

      onChangeSelectedDate() {
        this.setChartData(0);

        setTimeout(() => {
          this.showContentData();
        }, 300);
      },

      onPressCount(oEvent) {
        const oEventSource = oEvent.getSource();
        this.openPopover(oEventSource, `/table${oEventSource.data('table-key')}`);
      },

      async openPopover(oEventSource, sPath) {
        await this.createPopover();

        this.oPopover.close();
        this.oPopover.bindElement(sPath);

        setTimeout(() => {
          this.oPopover.openBy(oEventSource);
        }, 300);
      },

      async createPopover() {
        if (!this.oPopover) {
          this.oPopover = await Fragment.load({
            name: 'sap.ui.yesco.mvc.view.home.fragment.P06PortletDataPopover',
            controller: this,
          });

          this.getController().getView().addDependent(this.oPopover);

          this.oPopover
            .attachBeforeOpen(() => {
              const bVisiblePeriod = this.oPopover.getBindingContext().getProperty('visiblePeriod');
              this.oPopover.setContentWidth(bVisiblePeriod ? '447px' : '249px');
            })
            .setModel(this.getPortletModel());
        }
      },

      onAfterDragAndDrop() {
        FusionCharts(this.sChartId).render();
      },

      destroy() {
        if (this.oPopover) {
          this.oPopover.destroy();
        }

        AbstractPortletHandler.prototype.destroy.call(this);
      },
    });
  }
);
