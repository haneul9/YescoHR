sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/mobile/MobileEmployeeListPopoverHandler',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    MobileEmployeeListPopoverHandler,
    Client,
    ServiceNames
  ) => {
    'use strict';

    return MobileEmployeeListPopoverHandler.extend('sap.ui.yesco.mvc.controller.overviewEmployee.mobile.EmployeeList1PopoverHandler', {
      getPopoverFragmentName() {
        return 'sap.ui.yesco.mvc.view.overviewEmployee.mobile.EmployeeList1Popover';
      },

      setPropertiesForNavTo(oMenuModel) {
        this.bHasProfileViewAuth = oMenuModel.hasEmployeeProfileViewAuth();
      },

      async onBeforeOpen() {
        const oModel = this.oController.getModel(ServiceNames.PA);
        const mPayload = this.getPayloadData();

        const aEmployees = await Client.getEntitySet(oModel, 'HeadCountDetail', mPayload);
        const sUnknownAvatarImageURL = AppUtils.getUnknownAvatarImageURL();

        this.setEmployeeList(
          aEmployees.map(({ Photo, Ename, Pernr, Zzjikgbtx, Zzjikchtx, Orgtx }) => ({
            Photo: Photo || sUnknownAvatarImageURL,
            Ename,
            Pernr,
            Zzjikgbtx,
            Zzjikchtx,
            Orgtx,
            Navigable: this.bHasProfileViewAuth ? 'O' : '',
          }))
        );

        this.setBusy(false);
      },

      onAfterClose() {
        this.clearSearchFilter();
        this.clearTerms();
        this.clearEmployeeList();
      },

      onLiveChange(oEvent) {
        this.filterEmployeeList(oEvent);
      },
    });
  }
);
