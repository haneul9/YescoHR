sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
    'sap/ui/yesco/mvc/model/type/Currency', // XML expression binding용 type preloading
    'sap/ui/yesco/mvc/model/type/Date', // XML expression binding용 type preloading
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
      sChartId: 'portlet-absence-chart',

      async addPortlet() {
        const oPortletModel = this.getPortletModel();
        const oPortletBox = await Fragment.load({
          name: 'sap.ui.yesco.mvc.view.home.fragment.P06PortletBox',
          controller: this,
        });

        oPortletModel.setProperty('/selectedDate', new Date());

        oPortletBox.setModel(oPortletModel).bindElement('/');

        this.getController().byId(this.sContainerId).addItem(oPortletBox);
        this.setPortletBox(oPortletBox);

        this.buildChart();
      },

      buildChart() {
        FusionCharts.ready(() => {
          new FusionCharts({
            id: this.sChartId,
            type: 'cylinder',
            renderAt: 'portlet-absence-chart-container',
            width: '110px',
            height: '100%',
            dataFormat: 'json',
            dataSource: {
              chart: this.getChartOption(0),
              value: 0,
            },
          }).render();
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

        const mPortletContentData = {
          counts: { Datum, Week, ...mCountData }, // Cnt01, Cnt02, Cnt03, Cnt04, Cnt05, Cnt06, Cnt07
        };

        Object.keys(mCountData).forEach((sKey) => {
          const sTableKey = sKey.replace(/^[\D]+/, '').replace(/^0+/, '');
          const aTableData = mTables[sTableKey] || [];
          mPortletContentData[`table${sTableKey}`] = {
            list: aTableData,
            listCount: aTableData.length,
          };
        });

        const fValue = Number(mCountData.Cnt07);
        this.setChartData(fValue);

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
          this.oPopover.setModel(this.getPortletModel());
        }
      },

      async getPortletBox(oPortletModel) {
        if (!this.oPortletBox) {
          this.oPortletBox = await Fragment.load({
            name: 'sap.ui.yesco.mvc.view.home.fragment.P06PortletBox',
            controller: this,
          });

          oPortletModel.setProperty('/selectedDate', new Date());

          this.oPortletBox.setModel(oPortletModel).bindElement('/');
        }

        return this.oPortletBox;
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
