sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/M24PortletHandlerDialog1Handler',
    'sap/ui/yesco/mvc/controller/overviewAttendance/mobile/EmployeeList2PopoverHandler',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Client,
    ServiceNames,
    AbstractPortletHandler,
    M24PortletHandlerDialog1Handler,
    EmployeeList2PopoverHandler
  ) => {
    'use strict';

    /**
     * 휴가 사용율 Portlet (임원용)
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.M24PortletHandler', {
      async addPortlet() {
        const oController = this.getController();
        const oPortletModel = this.getPortletModel();
        const oPortletBox = await Fragment.load({
          id: oController.getView().getId(),
          name: 'sap.ui.yesco.mvc.view.home.fragment.M24PortletBox',
          controller: this,
        });

        const iPortletHeight = oPortletModel.getProperty('/height');
        oPortletBox
          .setModel(oPortletModel)
          .bindElement('/')
          .addStyleClass(this.bMobile ? 'h-auto' : `portlet-h${iPortletHeight}`);

        oController.byId(this.sContainerId).addItem(oPortletBox);
        this.setPortletBox(oPortletBox);

        this.oEmployeeListPopupHandler = this.oEmployeeListPopupHandler || (this.bMobile ? new EmployeeList2PopoverHandler(oController) : new M24PortletHandlerDialog1Handler(oController));
      },

      async readContentData() {
        const oController = this.getController();
        const oPortletModel = this.getPortletModel();
        const oSelectedDate = oPortletModel.getProperty('/selectedDate') || new Date();
        const mAppointeeData = oController.getAppointeeData();

        const oModel = oController.getModel(ServiceNames.WORKTIME);
        const mPayload = {
          Datum: moment(oSelectedDate).startOf('date').add(9, 'hours'),
          Werks: mAppointeeData.Werks,
          Orgeh: mAppointeeData.Orgeh,
          Headty: 'D',
        };

        return Client.getEntitySet(oModel, 'TimeOverview', mPayload);
      },

      transformContentData([{ Ttltxt, Cnt01 = '0', Cod01, Cnt03 = '0', Cod03 }]) {
        return {
          Ttltxt: Ttltxt ? `${Ttltxt}, ` : '',
          Annual: { Total: 100, Used: parseFloat(Cnt01), Headty: 'D', Discod: Cod01 },
          Summer: { Total: 100, Used: parseFloat(Cnt03), Headty: 'D', Discod: Cod03 },
        };
      },

      openDetailPopup(oEvent) {
        const mAppointeeData = this.oController.getAppointeeData();
        const mEventSourceData = oEvent.getSource().data();
        const mPayload = {
          Datum: moment().startOf('date').add(9, 'hours'),
          Werks: mAppointeeData.Werks,
          Orgeh: mAppointeeData.Orgeh,
          Headty: mEventSourceData.Headty,
          Discod: mEventSourceData.Discod,
        };

        if (this.bMobile) {
          this.oEmployeeListPopupHandler.openPopover(mPayload);
        } else {
          this.oEmployeeListPopupHandler.openDialog(mPayload);
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
