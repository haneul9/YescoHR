sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Client,
    ServiceNames,
    AbstractPortletHandler
  ) => {
    'use strict';

    /**
     * 인원 현황 Portlet (임원용)
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.M21PortletHandler', {
      async addPortlet() {
        const oPortletModel = this.getPortletModel();
        const oPortletBox = await Fragment.load({
          id: this.getController().getView().getId(),
          name: 'sap.ui.yesco.mvc.view.home.fragment.M21PortletBox',
          controller: this,
        });

        const iPortletHeight = oPortletModel.getProperty('/height');
        oPortletBox.setModel(oPortletModel).bindElement('/').addStyleClass(`portlet-h${iPortletHeight}`);

        this.getController().byId(this.sContainerId).addItem(oPortletBox);
        this.setPortletBox(oPortletBox);
      },

      async readContentData() {
        const oModel = this.getController().getModel(ServiceNames.COMMON);
        const mPayload = {
          PortletPerCnt1Nav: [],
          PortletPerCnt2Nav: [],
        };

        return Client.deep(oModel, 'PortletPernrCnt', mPayload);
      },

      transformContentData({ PortletPerCnt1Nav, PortletPerCnt2Nav }) {
        const mCountData = ((PortletPerCnt1Nav || {}).results || [])[0] || {};

        delete mCountData.__metadata;
        delete mCountData.PortletPerCnt1Nav;
        delete mCountData.PortletPerCnt2Nav;

        const mTables = {
          A1: [],
          A2: [],
          B1: [],
          B2: [],
        };
        ((PortletPerCnt2Nav || {}).results || []).forEach(({ Gub01, Gub02, Pernr, Ename, Orgtx, Stltx, Datum }) => {
          const sTableKey = `${Gub01}${Gub02}`;
          const mData = { Gub01, Gub02, Pernr, Ename, Orgtx, Stltx, Datum };

          mTables[sTableKey].push(mData);
        });

        const oPortletModel = this.getPortletModel();
        const mPortletContentData = {
          counts: mCountData,
        };

        Object.keys(mTables).forEach((sTableKey) => {
          const aTableData = mTables[sTableKey] || [];
          mPortletContentData[`table${sTableKey}`] = {
            category: sTableKey.charAt(0),
            list: aTableData,
            listCount: Math.min(aTableData.length, 5),
          };

          oPortletModel.setProperty(`/table${sTableKey}/list`, []);
        });

        return mPortletContentData;
      },

      onPressCount(oEvent) {
        const oEventSource = oEvent.getSource();
        this.openPopover(oEventSource, oEventSource.data('popover'), oEventSource.data('table-key').replace(/^k/, ''));
      },

      async openPopover(oEventSource, sPopover, sTableKey) {
        await this.createPopover();

        this.oPopover.close();
        if (sPopover === 'N') {
          return;
        }
        this.oPopover.bindElement(`/table${sTableKey}`);

        setTimeout(() => {
          this.oPopover.openBy(oEventSource);
        }, 300);
      },

      async createPopover() {
        if (!this.oPopover) {
          this.oPopover = await Fragment.load({
            name: 'sap.ui.yesco.mvc.view.home.fragment.M21PortletDataPopover',
            controller: this,
          });

          this.getController().getView().addDependent(this.oPopover);

          this.oPopover.setModel(this.getPortletModel());
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
