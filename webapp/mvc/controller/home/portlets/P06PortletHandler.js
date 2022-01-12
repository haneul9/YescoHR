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
     * 공지사항 Portlet
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.P06PortletHandler', {
      async readContentData() {
        const oModel = this.getController().getModel(ServiceNames.COMMON);
        const mPayload = {
          Datum: new Date(),
          PortletPcountNav1: [],
          PortletPcountNav2: [],
        };

        return Client.deep(oModel, 'PortletPernrCount', mPayload);
      },

      transformContentData({ PortletPcountNav1, PortletPcountNav2 }) {
        const { Datum, Week, Cnt01, Cnt02, Cnt03, Cnt04 } = ((PortletPcountNav1 || {}).results || [])[0] || {};

        const table1 = [];
        const table2 = [];
        const table3 = [];
        const table4 = [];

        ((PortletPcountNav2 || {}).results || []).forEach(({ Gubun, Pernr, Ename, Orgtx, Period }) => {
          const mData = { Pernr, Ename, Orgtx, Period };
          if (Gubun === '1') {
            table1.push(mData);
          } else if (Gubun === '2') {
            table2.push(mData);
          } else if (Gubun === '3') {
            table3.push(mData);
          } else if (Gubun === '4') {
            table4.push(mData);
          }
        });

        return {
          counts: { Datum, Week, Cnt01, Cnt02, Cnt03, Cnt04 },
          table1: {
            list: table1,
            listCount: table1.length,
          },
          table2: {
            list: table2,
            listCount: table2.length,
          },
          table3: {
            list: table3,
            listCount: table3.length,
          },
          table4: {
            list: table4,
            listCount: table4.length,
          },
        };
      },

      onAfterRendering() {
        var oButton = this.byId('showQuickView');
        oButton.$().attr('aria-haspopup', true);

        oButton = this.byId('employeeQuickView');
        oButton.$().attr('aria-haspopup', true);

        oButton = this.byId('genericQuickView');
        oButton.$().attr('aria-haspopup', true);
      },

      onHover1(oEvent) {
        this.openPopover(oEvent.getSource(), '/table1');
      },

      onHover2(oEvent) {
        this.openPopover(oEvent.getSource(), '/table2');
      },

      onHover3(oEvent) {
        this.openPopover(oEvent.getSource(), '/table3');
      },

      onHover4(oEvent) {
        this.openPopover(oEvent.getSource(), '/table4');
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
            name: 'sap.ui.yesco.mvc.view.home.fragment.PortletsP06Popover',
            controller: this,
          });

          this.getController().getView().addDependent(this.oPopover);
          this.oPopover.setModel(this.getPortletModel()).addStyleClass(AppUtils.getAppComponent().getContentDensityClass());
        }
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
