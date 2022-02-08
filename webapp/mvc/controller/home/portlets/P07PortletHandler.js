sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    AbstractPortletHandler
  ) => {
    'use strict';

    /**
     * 이런 메뉴 어떠세요? Portlet
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.P07PortletHandler', {
      init() {
        const oAppComponent = AppUtils.getAppComponent();
        this.oAppMenu = oAppComponent.getAppMenu();
        this.oMenuModel = oAppComponent.getMenuModel();

        AbstractPortletHandler.prototype.init.call(this);
      },

      async readContentData() {
        const oModel = this.getController().getModel(ServiceNames.COMMON);

        return Client.getEntitySet(oModel, 'PortletHowToMenu');
      },

      transformContentData(aPortletContentData = []) {
        // TEST
        aPortletContentData.push(
          { Seqnr: '1', Menid: '21100', Mennm: '근태신청' }, //
          { Seqnr: '2', Menid: '21400', Mennm: '통합굴착야간근무변경신청' },
          { Seqnr: '3', Menid: '21300', Mennm: '당직변경신청' }
        );
        // TEST-end

        const aList = aPortletContentData
          .filter(({ Menid }) => {
            return Menid && this.oMenuModel.getProperties(Menid);
          })
          .map(({ Menid }) => {
            return { ...this.oMenuModel.getProperties(Menid) };
          });
        return {
          list: aList,
          listCount: aList.length,
        };
      },

      formatMenuUrl(...aArgs) {
        return this.oAppMenu.formatMenuUrl(...aArgs);
      },

      formatMenuTarget(...aArgs) {
        return this.oAppMenu.formatMenuTarget(...aArgs);
      },

      handleMenuLink(...aArgs) {
        this.oAppMenu.handleMenuLink(...aArgs);
      },
    });
  }
);
