sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/EmployeeListDialogHandler',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
    'sap/ui/yesco/mvc/controller/overviewEmployee/mobile/EmployeeList1PopoverHandler',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    EmployeeListDialogHandler,
    Client,
    ServiceNames,
    AbstractPortletHandler,
    EmployeeList1PopoverHandler
  ) => {
    'use strict';

    /**
     * 인원현황 Portlet (임원용)
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

        const oController = this.getController();
        oController.byId(this.sContainerId).addItem(oPortletBox);
        this.setPortletBox(oPortletBox);

        this.oEmployeeListPopupHandler = this.oEmployeeListPopupHandler || (this.bMobile ? new EmployeeList1PopoverHandler(oController) : new EmployeeListDialogHandler(oController));
      },

      async readContentData() {
        const oModel = this.getController().getModel(ServiceNames.PA);
        const oSessionModel = this.getController().getSessionModel();
        const mPayload = {
          Zyear: moment().year(),
          Werks: oSessionModel.getProperty('/Werks'),
          Orgeh: oSessionModel.getProperty('/Orgeh'),
          Headty: 'A',
        };

        return Client.getEntitySet(oModel, 'HeadCountOverview', mPayload);
      },

      transformContentData(aPortletContentData = []) {
        aPortletContentData.forEach((mPortletContentData) => {
          delete mPortletContentData.__metadata;
        });

        return {
          contents: aPortletContentData,
        };
      },

      onPressCount(oEvent) {
        if (this.bMobile) {
          this.oEmployeeListPopupHandler.openPopover(oEvent);
        } else {
          this.oEmployeeListPopupHandler.openDialog(oEvent);
        }
      },

      destroy() {
        if (this.oEmployeeListPopupHandler) {
          this.oEmployeeListPopupHandler.destroy();
        }

        AbstractPortletHandler.prototype.destroy.call(this);
      },
    });
  }
);
