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
     * 휴가 사용율 Portlet (임원용)
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.M24PortletHandler', {
      async addPortlet() {
        const oPortletModel = this.getPortletModel();
        const oPortletBox = await Fragment.load({
          id: this.getController().getView().getId(),
          name: 'sap.ui.yesco.mvc.view.home.fragment.M24PortletBox',
          controller: this,
        });

        const iPortletHeight = oPortletModel.getProperty('/height');
        oPortletBox.setModel(oPortletModel).bindElement('/').addStyleClass(`portlet-h${iPortletHeight}`);

        this.getController().byId(this.sContainerId).addItem(oPortletBox);
        this.setPortletBox(oPortletBox);
      },

      async readContentData() {
        const oModel = this.getController().getModel(ServiceNames.WORKTIME);
        const mPayload = {
          Menid: this.getMenid('workTime'),
        };

        return Client.getEntitySet(oModel, 'WorkingTime', mPayload);
      },

      transformContentData(aPortletContentData = []) {
        aPortletContentData.forEach((mData) => {
          // if (mData.Gubun === '1') {
          //   aList.push(mData);
          // }
        });

        return {
          Annual: { Total: 15, Used: 10 },
          Summer: { Total: 5, Used: 2 },
        };
      },
    });
  }
);
