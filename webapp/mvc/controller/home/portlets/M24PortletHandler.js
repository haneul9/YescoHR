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
        const oPortletModel = this.getPortletModel();
        const oSelectedDate = oPortletModel.getProperty('/selectedDate') || new Date();
        const mAppointee = this.getController().getAppointeeData();

        const oModel = this.getController().getModel(ServiceNames.WORKTIME);
        const mPayload = {
          Datum: moment(oSelectedDate).startOf('date').add(9, 'hours'),
          Werks: mAppointee.Werks,
          Orgeh: mAppointee.Orgeh,
          Headty: 'D',
        };

        return Client.getEntitySet(oModel, 'TimeOverview', mPayload);
      },

      transformContentData([{ Cnt01 = '0', Cnt03 = '0' }]) {
        return {
          Annual: { Total: 100, Used: parseFloat(Cnt01) },
          Summer: { Total: 100, Used: parseFloat(Cnt03) },
        };
      },
    });
  }
);
