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
     * 즐겨찾기 Portlet
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
