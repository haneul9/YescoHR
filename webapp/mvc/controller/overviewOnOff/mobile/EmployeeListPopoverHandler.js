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

    return MobileEmployeeListPopoverHandler.extend('sap.ui.yesco.mvc.controller.overviewOnOff.mobile.EmployeeListPopoverHandler', {
      getPopoverFragmentName() {
        return 'sap.ui.yesco.fragment.mobile.MobileEmployeeListPopover';
      },

      setPropertiesForNavTo(oMenuModel) {
        this.bHasProfileViewAuth = oMenuModel.hasEmployeeProfileViewAuth();
      },

      async onBeforeOpen() {
        const oModel = this.oController.getModel(ServiceNames.PA);
        const mPayload = this.getPayloadData();
        const sEntitySet = mPayload.Entity === 'A' ? 'HeadCountDetail' : 'HeadCountEntRetDetail';

        delete mPayload.Entity;

        const aEmployees = await Client.getEntitySet(oModel, sEntitySet, mPayload);
        const sUnknownAvatarImageURL = AppUtils.getUnknownAvatarImageURL();

        this.setEmployeeList(
          aEmployees.map(({ Photo, Ename, Pernr, Zzjikgbtx, Zzjikchtx, Orgtx }) => ({
            Photo: Photo || sUnknownAvatarImageURL,
            Ename,
            Pernr,
            Zzjikcht: Zzjikgbtx,
            Zzjikgbt: Zzjikchtx,
            Fulln: Orgtx,
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
