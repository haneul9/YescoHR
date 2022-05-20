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

    return MobileEmployeeListPopoverHandler.extend('sap.ui.yesco.mvc.controller.overviewOnOff.mobile.EmployeeList3PopoverHandler', {
      getPopoverFragmentName() {
        return 'sap.ui.yesco.mvc.view.overviewOnOff.mobile.EmployeeList3Popover';
      },

      setPropertiesForNavTo(oMenuModel) {
        this.bHasProfileViewAuth = oMenuModel.hasEmployeeProfileViewAuth();
      },

      async onBeforeOpen() {
        const oModel = this.oController.getModel(ServiceNames.PA);
        const mPayload = this.getPayloadData();

        const aEmployees = await Client.getEntitySet(oModel, 'HeadCountEntRetDetail', mPayload);
        const sUnknownAvatarImageURL = AppUtils.getUnknownAvatarImageURL();

        this.setEmployeeList(
          aEmployees.map(({ Photo, Ename, Pernr, Zzjikgbtx, Zzjikchtx, Orgtx, Entda, Retda }) => ({
            Photo: Photo || sUnknownAvatarImageURL,
            Ename,
            Pernr,
            Zzjikgbtx,
            Zzjikchtx,
            Orgtx,
            Entda,
            Retda,
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
