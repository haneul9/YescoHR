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
      async readContentData() {
        const oModel = this.getController().getModel(ServiceNames.COMMON);

        return Client.getEntitySet(oModel, 'PortletHowToMenu');
      },

      transformContentData(aPortletContentData = []) {
        const oMenuModel = this.getMenuModel();
        const aList = aPortletContentData
          .filter(({ Menid }) => {
            return Menid && oMenuModel.getProperties(Menid);
          })
          .map(({ Menid }) => {
            return { ...oMenuModel.getProperties(Menid) };
          });
        return {
          list: aList,
          listCount: aList.length,
        };
      },
    });
  }
);
